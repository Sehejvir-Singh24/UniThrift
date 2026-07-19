<script>
        // Progress bar initial animation
        setTimeout(() => {
            const progressBar = document.getElementById('progress-bar');
            if(progressBar) {
                progressBar.style.transform = 'scaleX(0.5)';
            }
        }, 300);

        function validateInput(input, requiredLength) {
            // Only allow numbers
            input.value = input.value.replace(/[^0-9]/g, '');
            
            const checkIcon = document.getElementById(`${input.id}-check`);
            const errorMsg = document.getElementById(`${input.id}-error`);
            
            if (input.value.length === requiredLength) {
                if(checkIcon) checkIcon.classList.remove('opacity-0');
                if(errorMsg) errorMsg.classList.add('hidden');
            } else {
                if(checkIcon) checkIcon.classList.add('opacity-0');
                if(errorMsg && input.value.length > 0 && input.id === 'enrollment') {
                   // Optional: show error while typing if needed, currently hidden until blur or manual logic
                }
            }
            
            checkFormCompleteness();
        }

        function checkFormCompleteness() {
            const enrollment = document.getElementById('enrollment').value;
            const fullname = document.getElementById('fullname').value;
            const college = document.getElementById('college').value;
            const phone = document.getElementById('phone').value;
            const btn = document.getElementById('next-btn');

            const isEnrollmentValid = (selectedYear === '1st Year' && enrollment.length === 0) || enrollment.length === 11;
            
            const defaultPlaceholder = "https://lh3.googleusercontent.com/aida-public/AB6AXuCO80v9oBxazBMg4_hybg4dNFOJpVb62CeRrKE7f7GVkyegLDnliILUgYKKo__P7-6eK3S8JJ7hgvjouOiLV-Za-vEsbGYEsKt_BZE7WyZKaDsGZH_MiiA_qFAxjXEGoLEiLK2DJYKTT77SRV0N3zMuN4gbbO7LrAKxcBYXBHcA_3-wi7ghZeza4NFVOW_mXl3tJfLB5T8Yml1sK1Ek-JcYEEYSPDXs8bFE28rnxRw_dq70HNOQL3QFhOyR0jwdIxG1cNgHC5WqmFLz";
            const avatarSrc = document.getElementById('profile-avatar').src;
            const hasAvatar = croppedBlob || (avatarSrc && avatarSrc !== defaultPlaceholder);

            const isValid = isEnrollmentValid && fullname.length > 2 && phone.length === 10 && college && hasAvatar;

            if (isValid) {
                btn.removeAttribute('disabled');
                btn.classList.remove('bg-surface-container-highest', 'text-on-surface-variant');
                btn.classList.add('bg-primary-container', 'text-on-primary-container');
                // Pulse animation
                btn.style.transform = 'scale(1.02)';
                setTimeout(() => btn.style.transform = 'scale(1)', 200);
            } else {
                btn.setAttribute('disabled', 'true');
                btn.classList.add('bg-surface-container-highest', 'text-on-surface-variant');
                btn.classList.remove('bg-primary-container', 'text-on-primary-container');
            }
        }

        // Add blur listener for enrollment specific error
        document.getElementById('enrollment')?.addEventListener('blur', function() {
            const errorMsg = document.getElementById('enrollment-error');
            if(this.value.length > 0 && this.value.length < 11) {
                errorMsg.classList.remove('hidden');
                this.parentElement.classList.add('ring-2', 'ring-error', 'bg-error-container/20');
            } else {
                errorMsg.classList.add('hidden');
                this.parentElement.classList.remove('ring-2', 'ring-error', 'bg-error-container/20');
            }
        });

        let selectedYear = '1st Year';

        function selectYear(btn, year) {
            selectedYear = year;
            const buttons = document.getElementById('year-buttons').querySelectorAll('button');
            buttons.forEach(b => {
                b.className = 'flex-1 py-2 px-3 rounded-lg font-body-sm transition-all text-on-surface-variant hover:bg-surface-container';
            });
            btn.className = 'flex-1 py-2 px-3 rounded-lg font-body-sm transition-all bg-primary text-on-primary shadow-sm';
            checkFormCompleteness();
        }

        async function animateNextStep() {
            const btn = document.getElementById('next-btn');
            const icon = document.getElementById('next-icon');
            const progressBar = document.getElementById('progress-bar');
            
            const enrollment = document.getElementById('enrollment').value;
            const fullname = document.getElementById('fullname').value;
            const college = document.getElementById('college').value;
            const phone = document.getElementById('phone').value;

            // Button loading state
            btn.innerHTML = `<span class="material-symbols-outlined animate-spin">progress_activity</span><span class="ml-2">Saving...</span>`;
            
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) throw new Error("No active session");

                let publicUrl = null;
                if (croppedBlob) {
                    const file = new File([croppedBlob], `avatar_${Date.now()}.jpg`, { type: 'image/jpeg' });
                    publicUrl = await uploadAvatar(session.user.id, file);
                }

                const profileUpdates = {
                    full_name: fullname,
                    phone_number: phone,
                    enrollment_number: enrollment,
                    year_of_study: selectedYear,
                    college: college
                };

                if (publicUrl) {
                    profileUpdates.avatar_url = publicUrl;
                } else {
                    const defaultPlaceholder = "https://lh3.googleusercontent.com/aida-public/AB6AXuCO80v9oBxazBMg4_hybg4dNFOJpVb62CeRrKE7f7GVkyegLDnliILUgYKKo__P7-6eK3S8JJ7hgvjouOiLV-Za-vEsbGYEsKt_BZE7WyZKaDsGZH_MiiA_qFAxjXEGoLEiLK2DJYKTT77SRV0N3zMuN4gbbO7LrAKxcBYXBHcA_3-wi7ghZeza4NFVOW_mXl3tJfLB5T8Yml1sK1Ek-JcYEEYSPDXs8bFE28rnxRw_dq70HNOQL3QFhOyR0jwdIxG1cNgHC5WqmFLz";
                    const avatarSrc = document.getElementById('profile-avatar').src;
                    if (avatarSrc && avatarSrc !== defaultPlaceholder) {
                        profileUpdates.avatar_url = avatarSrc;
                    }
                }

                await updateProfile(profileUpdates);

                // Success state
                btn.classList.replace('bg-primary-container', 'bg-primary');
                btn.classList.replace('text-on-primary-container', 'text-on-primary');
                btn.innerHTML = `<span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">check</span><span class="ml-2">Success</span>`;
                
                if(progressBar) progressBar.style.transform = 'scaleX(1)';
                
                setTimeout(() => {
                    window.location.href = '/auth/id_verification.html';
                }, 800);
            } catch (err) {
                alert("Error saving profile: " + err.message);
                btn.innerHTML = `<span>Continue</span><span class="material-symbols-outlined transition-transform duration-300 group-hover:translate-x-1" id="next-icon">arrow_forward</span>`;
            }
        }

        let cropper = null;
        let croppedBlob = null;

        function handleAvatarChange(event) {
            const file = event.target.files[0];
            if (!file) return;

            event.target.value = '';

            const url = URL.createObjectURL(file);
            const image = document.getElementById('crop-image');
            image.src = url;

            const modal = document.getElementById('crop-modal');
            const content = document.getElementById('crop-modal-content');
            modal.classList.remove('hidden');
            setTimeout(() => {
                modal.classList.remove('opacity-0');
                content.classList.remove('scale-95');
            }, 10);

            if (cropper) cropper.destroy();
            cropper = new Cropper(image, {
                aspectRatio: 1,
                viewMode: 1,
                dragMode: 'move',
                guides: false,
                center: true,
                highlight: false,
                cropBoxMovable: false,
                cropBoxResizable: false,
                toggleDragModeOnDblclick: false
            });
        }

        function cancelCrop() {
            const modal = document.getElementById('crop-modal');
            const content = document.getElementById('crop-modal-content');
            modal.classList.add('opacity-0');
            content.classList.add('scale-95');
            setTimeout(() => {
                modal.classList.add('hidden');
                if (cropper) {
                    cropper.destroy();
                    cropper = null;
                }
            }, 300);
        }

        async function confirmCrop() {
            if (!cropper) return;
            const btn = document.getElementById('confirm-crop-btn');
            const oldText = btn.innerHTML;
            btn.innerHTML = 'Processing...';
            btn.disabled = true;

            try {
                const canvas = cropper.getCroppedCanvas({
                    width: 300,
                    height: 300,
                    imageSmoothingEnabled: true,
                    imageSmoothingQuality: 'high',
                });

                croppedBlob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.9));
                const url = URL.createObjectURL(croppedBlob);
                document.getElementById('profile-avatar').src = url;
                cancelCrop();
                checkFormCompleteness();
            } catch (e) {
                console.error(e);
                alert("Failed to process photo.");
            } finally {
                btn.innerHTML = oldText;
                btn.disabled = false;
            }
        }
    </script>