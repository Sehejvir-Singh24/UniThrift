# Automated Student ID Verification with Gemini 2.5 Flash

This document outlines the architecture, database schema, serverless function, and frontend modifications required to build a fully automated student ID verification pipeline for **UniThrift**.

Currently, the frontend updates a user's profile to `is_verified: true` immediately upon ID card upload. The automated solution replaces this with a secure backend check using **Supabase Edge Functions** and the **Gemini 2.5 Flash API**.

---

## 1. System Architecture Flow

The workflow below details how a student ID card is processed, verified, and updated asynchronously.

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Frontend as Frontend Browser
    participant Storage as Supabase Storage (id_cards)
    participant Database as Supabase DB (profiles)
    participant EdgeFunc as Supabase Edge Function
    participant Gemini as Gemini 2.5 Flash API

    User->>Frontend: Uploads ID Card Image
    Frontend->>Storage: Upload compressed image to private folder
    Storage-->>Frontend: Return public/private URL (id_url)
    Frontend->>Database: Update profile: id_url & verification_status = 'pending'
    Frontend->>EdgeFunc: Trigger verification (via HTTP request or DB Webhook)
    Frontend->>Frontend: Redirect to pending_verification.html
    activate EdgeFunc
    EdgeFunc->>Database: Fetch user profile data (name, college, enrollment, year)
    EdgeFunc->>Storage: Fetch uploaded ID image blob
    EdgeFunc->>Gemini: Send image + profile data + matching prompt
    Gemini-->>EdgeFunc: Return structured JSON (is_valid, matched_fields, reason)
    alt Verification Successful
        EdgeFunc->>Database: Update profile: is_verified = true, verification_status = 'verified'
    else Verification Failed
        EdgeFunc->>Database: Update profile: is_verified = false, verification_status = 'rejected', verification_feedback = 'reason'
    end
    deactivate EdgeFunc
    User->>Frontend: Clicks "Check Status"
    Frontend->>Database: Query verification_status
    alt Verified
        Frontend->>Frontend: Redirect to index.html (Dashboard)
    alt Rejected
        Frontend->>Frontend: Display rejection reason & show "Retry Upload"
    end
```

---

## 2. Step 1: Database Migration Schema

We need to add stateful tracking to the `profiles` table. Run this SQL in your Supabase SQL Editor:

```sql
-- 1. Extend profiles table with verification state columns
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS verification_status TEXT CHECK (verification_status IN ('unverified', 'pending', 'verified', 'rejected')) DEFAULT 'unverified';

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS verification_feedback TEXT;

-- 2. Sync existing data (optional)
UPDATE public.profiles 
SET verification_status = 'verified' 
WHERE is_verified = true;

UPDATE public.profiles 
SET verification_status = 'unverified' 
WHERE is_verified = false AND id_url IS NULL;

UPDATE public.profiles 
SET verification_status = 'pending' 
WHERE is_verified = false AND id_url IS NOT NULL;
```

---

## 3. Step 2: Supabase Edge Function (Deno)

Create a new Supabase Edge Function: `supabase functions new verify-student-id`. Put the following code in `supabase/functions/verify-student-id/index.ts`. 

This function uses **Gemini 2.5 Flash** because it is extremely fast, cost-efficient, handles multimodal inputs natively, and supports structured JSON outputs.

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "" // Service role needed to bypass RLS and read private files
    );

    // 1. Parse the request payload
    const { userId } = await req.json();
    if (!userId) {
      return new Response(JSON.stringify({ error: "Missing userId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Fetch User Profile
    const { data: profile, error: profileError } = await supabaseClient
      .from("profiles")
      .select("full_name, college, enrollment_number, year_of_study, id_url")
      .eq("id", userId)
      .single();

    if (profileError || !profile || !profile.id_url) {
      throw new Error(`Profile not found or missing ID URL: ${profileError?.message}`);
    }

    // 3. Download ID Card image from Supabase Storage
    // Extract file path from URL (e.g. from "http://.../storage/v1/object/public/id_cards/uuid/file.jpg" -> "uuid/file.jpg")
    const urlParts = profile.id_url.split('/id_cards/');
    if (urlParts.length < 2) {
      throw new Error("Invalid ID URL format");
    }
    const filePath = decodeURIComponent(urlParts[1]);

    const { data: fileData, error: fileError } = await supabaseClient.storage
      .from("id_cards")
      .download(filePath);

    if (fileError || !fileData) {
      throw new Error(`Failed to download ID card image: ${fileError?.message}`);
    }

    // Convert file to base64 for Gemini
    const arrayBuffer = await fileData.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    const base64Image = btoa(
      Array.from(uint8Array)
        .map((val) => String.fromCharCode(val))
        .join("")
    );

    // 4. Send to Gemini for Multimodal Verification
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      throw new Error("Missing GEMINI_API_KEY environment variable");
    }

    const systemPrompt = `You are an automated campus security verification system for UniThrift.
Your job is to analyze the student ID card image and match it against the student's registered profile.

Student Profile Details:
- Full Name: ${profile.full_name}
- College/Campus: ${profile.college}
- Enrollment Number: ${profile.enrollment_number || "Not provided (Optional for 1st Year)"}
- Year of Study: ${profile.year_of_study}

Verification Rules:
1. Verify if the uploaded document is a student ID card, fee receipt, or library card from Guru Gobind Singh Indraprastha University (GGSIPU) or one of its affiliated colleges. (Allow high school ID or admission slip ONLY if Year of Study is '1st Year').
2. Match the name: Ensure the name on the ID card matches "${profile.full_name}". Support fuzzy matches (e.g., middle names omitted, or spelling typos like "Sehejvir Singh" vs "Sehajvir Singh").
3. Match the college: Ensure the college name on the ID matches "${profile.college}" or the full name of that college (e.g., "USICT" matches "University School of Information, Communication and Technology").
4. Match the Enrollment Number: If an enrollment number is provided (${profile.enrollment_number}), match it. If the student registered it but the ID card has a completely different enrollment number, reject it.
5. Identify fraud: If the image is a blank card, random scenery, a selfie, a meme, or heavily edited, mark it as invalid.

You must respond in JSON with the exact structure:
{
  "is_valid": boolean,
  "matched_fields": {
    "name": boolean,
    "college": boolean,
    "enrollment_number": boolean
  },
  "extracted_fields": {
    "name": string,
    "college": string,
    "enrollment_number": string
  },
  "rejection_reason": string (explain why it is invalid or empty string if valid)
}`;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    
    const response = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: systemPrompt },
              {
                inlineData: {
                  mimeType: fileData.type || "image/jpeg",
                  data: base64Image,
                },
              },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API returned error code ${response.status}: ${errText}`);
    }

    const result = await response.json();
    const responseText = result.candidates[0].content.parts[0].text;
    const verificationResult = JSON.parse(responseText);

    // 5. Update Database based on Verdict
    const finalUpdate = {
      is_verified: verificationResult.is_valid,
      verification_status: verificationResult.is_valid ? "verified" : "rejected",
      verification_feedback: verificationResult.is_valid ? null : verificationResult.rejection_reason,
    };

    const { error: updateError } = await supabaseClient
      .from("profiles")
      .update(finalUpdate)
      .eq("id", userId);

    if (updateError) {
      throw new Error(`Failed to update profile verification status: ${updateError.message}`);
    }

    return new Response(JSON.stringify({ success: true, result: verificationResult }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Verification Edge Function Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
```

---

## 4. Step 3: Frontend Updates

### A. Updating `/auth/id_verification.html`
In `/auth/id_verification.html`, change the submission handler (`continueBtn` listener) to mark status as `pending` and trigger the Edge Function:

```javascript
    continueBtn.addEventListener('click', async () => {
        if (!selectedFile) return;
        
        continueBtn.innerHTML = `<span class="material-symbols-outlined animate-spin">progress_activity</span> Uploading...`;
        continueBtn.classList.add('pointer-events-none');
        try {
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            if (sessionError || !session) throw new Error("Not authenticated");
            
            const userId = session.user.id;
            const fileExt = selectedFile.name.split('.').pop();
            const filePath = `${userId}/id_card_${Date.now()}.${fileExt}`;
            
            // 1. Upload to Supabase Storage
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('id_cards')
                .upload(filePath, selectedFile, { upsert: true });
                
            if (uploadError) throw uploadError;
            
            const { data: publicUrlData } = supabase.storage
                .from('id_cards')
                .getPublicUrl(filePath);
                
            const idUrl = publicUrlData.publicUrl;

            // 2. Set database status to 'pending'
            await updateProfile({ 
                is_verified: false, 
                id_url: idUrl,
                verification_status: 'pending',
                verification_feedback: null 
            });

            // 3. Trigger the verification edge function in the background
            supabase.functions.invoke('verify-student-id', {
                body: { userId: userId }
            }).catch(err => {
                console.error("Edge function trigger failed", err);
                // Fail gracefully: function will run, or admin can verify manually
            });

            // 4. Redirect to the pending page
            window.location.href = '/auth/pending_verification.html';
        } catch(err) {
            console.error("Upload error:", err);
            alert("Upload failed: " + err.message);
            continueBtn.innerHTML = `Upload & Continue <span class="material-symbols-outlined text-[20px]">arrow_forward</span>`;
            continueBtn.classList.remove('pointer-events-none');
        }
    });
```

### B. Updating `/auth/pending_verification.html`
Modify `/auth/pending_verification.html` to dynamically handle **pending** and **rejected** states. If verification fails, it displays Gemini's feedback and allows the user to re-upload.

Here is the updated logic for the `<script>` block in `/auth/pending_verification.html`:

```javascript
    async function checkStatus() {
        const btnText = document.getElementById('btn-text');
        const btnIcon = document.getElementById('btn-icon');
        btnText.innerText = 'Checking...';
        btnIcon.classList.add('animate-spin');

        const profile = await getProfile();
        
        setTimeout(() => {
            btnIcon.classList.remove('animate-spin');
            if (profile) {
                if (profile.verification_status === 'verified' || profile.is_verified) {
                    window.location.href = '/index.html';
                } else if (profile.verification_status === 'rejected') {
                    // Update UI state to show rejection feedback
                    showRejectionState(profile.verification_feedback);
                } else {
                    btnText.innerText = 'Still Pending';
                    setTimeout(() => {
                        btnText.innerText = 'Check Status Again';
                    }, 2000);
                }
            }
        }, 1000);
    }

    function showRejectionState(feedback) {
        // Find or create elements in pending_verification.html to show details
        const cardHeader = document.querySelector('h1');
        const cardText = document.querySelector('p');
        const iconSpan = document.querySelector('span.material-symbols-outlined');
        const iconBg = iconSpan.parentElement;

        // Change hourglass icon to warning
        iconSpan.innerText = 'warning';
        iconSpan.className = 'material-symbols-outlined text-[48px] text-error relative z-10';
        iconBg.querySelector('.bg-primary\\/10').className = 'absolute inset-0 bg-error/10';

        cardHeader.innerText = 'Verification Failed';
        cardText.innerHTML = `Your ID card was rejected for the following reason:<br><strong class="text-error">${feedback || "Invalid ID format or name mismatch."}</strong>`;

        // Change button to take user back to re-upload
        const checkBtn = document.getElementById('check-btn');
        checkBtn.onclick = () => {
            window.location.href = '/auth/id_verification.html';
        };
        document.getElementById('btn-text').innerText = 'Upload a Different ID';
        document.getElementById('btn-icon').innerText = 'arrow_forward';
    }

    // Auto check on load
    document.addEventListener('DOMContentLoaded', async () => {
        const profile = await getProfile();
        if (profile && profile.verification_status === 'rejected') {
            showRejectionState(profile.verification_feedback);
        } else if (profile && (profile.verification_status === 'verified' || profile.is_verified)) {
            window.location.href = '/index.html';
        }
    });

    async function logout() {
        await supabase.auth.signOut();
        window.location.href = '/auth/login.html';
    }
```

---

## 5. Security & Edge Case Handling

1. **Service Role Access:** Standard Supabase security policies (RLS) prevent users from reading other users' ID cards. The Edge Function must use the `SUPABASE_SERVICE_ROLE_KEY` to download the image from the bucket and read the user's profile.
2. **File Compression:** The frontend's existing Canvas-based compression is kept. This is critical because Gemini API charges are based on token size, and large image files increase latency.
3. **Graceful Failures:** If the Gemini API fails, or the Edge Function crashes, the user's status remains `'pending'`. You can build a simple internal Admin Dashboard inside UniThrift to allow manual verification for these edge cases.
