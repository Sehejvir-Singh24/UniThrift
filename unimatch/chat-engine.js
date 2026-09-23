/**
 * UniMatch On-Site Chat Engine with Backend Storage Compression & Multi-Device Sync
 * Encodes & compresses chat messages before persisting directly to Supabase DB,
 * enabling seamless multi-device cross-sync (mobile & desktop).
 */

(function(window) {
  // LZ-String Compression implementation for minimal backend storage
  const LZCompressor = {
    keyStrBase64: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
    
    compress: function(uncompressed) {
      if (uncompressed === null || uncompressed === undefined) return "";
      let i, value;
      let context_dictionary = {},
          context_dictionaryToCreate = {},
          context_c = "",
          context_wc = "",
          context_w = "",
          context_enlargeIn = 2,
          context_dictSize = 3,
          context_numBits = 2,
          context_data = [],
          context_data_val = 0,
          context_data_position = 0;

      for (let ii = 0; ii < uncompressed.length; ii += 1) {
        context_c = uncompressed.charAt(ii);
        if (!Object.prototype.hasOwnProperty.call(context_dictionary, context_c)) {
          context_dictionary[context_c] = context_dictSize++;
          context_dictionaryToCreate[context_c] = true;
        }

        context_wc = context_w + context_c;
        if (Object.prototype.hasOwnProperty.call(context_dictionary, context_wc)) {
          context_w = context_wc;
        } else {
          if (Object.prototype.hasOwnProperty.call(context_dictionaryToCreate, context_w)) {
            if (context_w.charCodeAt(0) < 256) {
              for (i = 0; i < context_numBits; i++) {
                context_data_val = (context_data_val << 1);
                if (context_data_position == 15) {
                  context_data_position = 0;
                  context_data.push(String.fromCharCode(context_data_val));
                  context_data_val = 0;
                } else {
                  context_data_position++;
                }
              }
              value = context_w.charCodeAt(0);
              for (i = 0; i < 8; i++) {
                context_data_val = (context_data_val << 1) | (value & 1);
                if (context_data_position == 15) {
                  context_data_position = 0;
                  context_data.push(String.fromCharCode(context_data_val));
                  context_data_val = 0;
                } else {
                  context_data_position++;
                }
                value = value >> 1;
              }
            } else {
              value = 1;
              for (i = 0; i < context_numBits; i++) {
                context_data_val = (context_data_val << 1) | value;
                if (context_data_position == 15) {
                  context_data_position = 0;
                  context_data.push(String.fromCharCode(context_data_val));
                  context_data_val = 0;
                } else {
                  context_data_position++;
                }
                value = 0;
              }
              value = context_w.charCodeAt(0);
              for (i = 0; i < 16; i++) {
                context_data_val = (context_data_val << 1) | (value & 1);
                if (context_data_position == 15) {
                  context_data_position = 0;
                  context_data.push(String.fromCharCode(context_data_val));
                  context_data_val = 0;
                } else {
                  context_data_position++;
                }
                value = value >> 1;
              }
            }
            context_enlargeIn--;
            if (context_enlargeIn == 0) {
              context_enlargeIn = Math.pow(2, context_numBits);
              context_numBits++;
            }
            delete context_dictionaryToCreate[context_w];
          } else {
            value = context_dictionary[context_w];
            for (i = 0; i < context_numBits; i++) {
              context_data_val = (context_data_val << 1) | (value & 1);
              if (context_data_position == 15) {
                context_data_position = 0;
                context_data.push(String.fromCharCode(context_data_val));
                context_data_val = 0;
              } else {
                context_data_position++;
              }
              value = value >> 1;
            }
          }
          context_enlargeIn--;
          if (context_enlargeIn == 0) {
            context_enlargeIn = Math.pow(2, context_numBits);
            context_numBits++;
          }
          context_w = String(context_c);
        }
      }

      if (context_w !== "") {
        if (Object.prototype.hasOwnProperty.call(context_dictionaryToCreate, context_w)) {
          if (context_w.charCodeAt(0) < 256) {
            for (i = 0; i < context_numBits; i++) {
              context_data_val = (context_data_val << 1);
              if (context_data_position == 15) {
                context_data_position = 0;
                context_data.push(String.fromCharCode(context_data_val));
                context_data_val = 0;
              } else {
                context_data_position++;
              }
            }
            value = context_w.charCodeAt(0);
            for (i = 0; i < 8; i++) {
              context_data_val = (context_data_val << 1) | (value & 1);
              if (context_data_position == 15) {
                context_data_position = 0;
                context_data.push(String.fromCharCode(context_data_val));
                context_data_val = 0;
              } else {
                context_data_position++;
              }
              value = value >> 1;
            }
          } else {
            value = 1;
            for (i = 0; i < context_numBits; i++) {
              context_data_val = (context_data_val << 1) | value;
              if (context_data_position == 15) {
                context_data_position = 0;
                context_data.push(String.fromCharCode(context_data_val));
                context_data_val = 0;
              } else {
                context_data_position++;
              }
              value = 0;
            }
            value = context_w.charCodeAt(0);
            for (i = 0; i < 16; i++) {
              context_data_val = (context_data_val << 1) | (value & 1);
              if (context_data_position == 15) {
                context_data_position = 0;
                context_data.push(String.fromCharCode(context_data_val));
                context_data_val = 0;
              } else {
                context_data_position++;
              }
              value = value >> 1;
            }
          }
          context_enlargeIn--;
          if (context_enlargeIn == 0) {
            context_enlargeIn = Math.pow(2, context_numBits);
            context_numBits++;
          }
          delete context_dictionaryToCreate[context_w];
        } else {
          value = context_dictionary[context_w];
          for (i = 0; i < context_numBits; i++) {
            context_data_val = (context_data_val << 1) | (value & 1);
            if (context_data_position == 15) {
              context_data_position = 0;
              context_data.push(String.fromCharCode(context_data_val));
              context_data_val = 0;
            } else {
              context_data_position++;
            }
            value = value >> 1;
          }
        }
        context_enlargeIn--;
        if (context_enlargeIn == 0) {
          context_enlargeIn = Math.pow(2, context_numBits);
          context_numBits++;
        }
      }

      value = 2;
      for (i = 0; i < context_numBits; i++) {
        context_data_val = (context_data_val << 1) | (value & 1);
        if (context_data_position == 15) {
          context_data_position = 0;
          context_data.push(String.fromCharCode(context_data_val));
          context_data_val = 0;
        } else {
          context_data_position++;
        }
        value = value >> 1;
      }

      while (true) {
        context_data_val = (context_data_val << 1);
        if (context_data_position == 15) {
          context_data.push(String.fromCharCode(context_data_val));
          break;
        } else context_data_position++;
      }
      return context_data.join('');
    },

    decompress: function(compressed) {
      if (compressed == null) return "";
      if (compressed == "") return null;
      let dictionary = [],
          next,
          enlargeIn = 4,
          dictSize = 4,
          numBits = 3,
          entry = "",
          result = [],
          i,
          w,
          c,
          data = { val: compressed.charCodeAt(0), position: 32768, index: 1 };

      for (i = 0; i < 3; i += 1) {
        dictionary[i] = i;
      }

      let bits = 0, maxpower = Math.pow(2, 2), power = 1;
      while (power != maxpower) {
        let resb = data.val & data.position;
        data.position >>= 1;
        if (data.position == 0) {
          data.position = 32768;
          data.val = compressed.charCodeAt(data.index++);
        }
        bits |= (resb > 0 ? 1 : 0) * power;
        power <<= 1;
      }

      switch (next = bits) {
        case 0:
          bits = 0; maxpower = Math.pow(2, 8); power = 1;
          while (power != maxpower) {
            let resb = data.val & data.position;
            data.position >>= 1;
            if (data.position == 0) {
              data.position = 32768;
              data.val = compressed.charCodeAt(data.index++);
            }
            bits |= (resb > 0 ? 1 : 0) * power;
            power <<= 1;
          }
          c = String.fromCharCode(bits);
          break;
        case 1:
          bits = 0; maxpower = Math.pow(2, 16); power = 1;
          while (power != maxpower) {
            let resb = data.val & data.position;
            data.position >>= 1;
            if (data.position == 0) {
              data.position = 32768;
              data.val = compressed.charCodeAt(data.index++);
            }
            bits |= (resb > 0 ? 1 : 0) * power;
            power <<= 1;
          }
          c = String.fromCharCode(bits);
          break;
        case 2:
          return "";
      }
      dictionary[3] = c;
      w = c;
      result.push(c);
      while (true) {
        if (data.index > compressed.length) {
          return "";
        }

        bits = 0; maxpower = Math.pow(2, numBits); power = 1;
        while (power != maxpower) {
          let resb = data.val & data.position;
          data.position >>= 1;
          if (data.position == 0) {
            data.position = 32768;
            data.val = compressed.charCodeAt(data.index++);
          }
          bits |= (resb > 0 ? 1 : 0) * power;
          power <<= 1;
        }

        switch (c = bits) {
          case 0:
            bits = 0; maxpower = Math.pow(2, 8); power = 1;
            while (power != maxpower) {
              let resb = data.val & data.position;
              data.position >>= 1;
              if (data.position == 0) {
                data.position = 32768;
                data.val = compressed.charCodeAt(data.index++);
              }
              bits |= (resb > 0 ? 1 : 0) * power;
              power <<= 1;
            }
            dictionary[dictSize++] = String.fromCharCode(bits);
            c = dictSize - 1;
            enlargeIn--;
            break;
          case 1:
            bits = 0; maxpower = Math.pow(2, 16); power = 1;
            while (power != maxpower) {
              let resb = data.val & data.position;
              data.position >>= 1;
              if (data.position == 0) {
                data.position = 32768;
                data.val = compressed.charCodeAt(data.index++);
              }
              bits |= (resb > 0 ? 1 : 0) * power;
              power <<= 1;
            }
            dictionary[dictSize++] = String.fromCharCode(bits);
            c = dictSize - 1;
            enlargeIn--;
            break;
          case 2:
            return result.join('');
        }

        if (enlargeIn == 0) {
          enlargeIn = Math.pow(2, numBits);
          numBits++;
        }

        if (dictionary[c]) {
          entry = dictionary[c];
        } else {
          if (c === dictSize) {
            entry = w + w.charAt(0);
          } else {
            return null;
          }
        }
        result.push(entry);

        dictionary[dictSize++] = w + entry.charAt(0);
        enlargeIn--;

        if (enlargeIn == 0) {
          enlargeIn = Math.pow(2, numBits);
          numBits++;
        }

        w = entry;
      }
    }
  };

  const UniMatchChatEngine = {
    compressText: function(text) {
      if (!text) return "";
      try {
        return LZCompressor.compress(text);
      } catch(e) {
        return text;
      }
    },

    decompressText: function(compressedPayload) {
      if (!compressedPayload) return "";
      try {
        const decompressed = LZCompressor.decompress(compressedPayload);
        return decompressed || compressedPayload;
      } catch(e) {
        return compressedPayload;
      }
    },

    /**
     * Sends a compressed message between two users directly to Supabase
     */
    sendMessage: async function(senderId, receiverId, text) {
      if (!text || !text.trim()) return null;
      const trimmed = text.trim();
      const compressedText = this.compressText(trimmed);

      const msgObj = {
        id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        sender_id: senderId,
        receiver_id: receiverId,
        compressed_text: compressedText,
        text: trimmed,
        is_compressed: true,
        created_at: new Date().toISOString()
      };

      // 1. Save to local cache for instant UI rendering
      this._saveLocalMessage(senderId, receiverId, msgObj);

      // 2. Persist to Supabase Database (Multi-Device Sync)
      if (window.supabase && senderId && receiverId) {
        try {
          const { data, error } = await window.supabase
            .from('unimatch_chats')
            .insert({
              sender_id: senderId,
              receiver_id: receiverId,
              compressed_text: compressedText,
              text: trimmed,
              is_compressed: true
            })
            .select()
            .single();

          if (error) {
            // Try fallback table chat_messages
            await window.supabase
              .from('chat_messages')
              .insert({
                sender_id: senderId,
                receiver_id: receiverId,
                text: trimmed,
                compressed_text: compressedText
              });
          } else if (data) {
            msgObj.id = data.id;
          }
        } catch(e) {
          console.warn("Supabase chat sync warning:", e);
        }
      }

      return msgObj;
    },

    /**
     * Fetches all chat messages between two users directly from Supabase Database
     */
    getMessages: async function(userId1, userId2) {
      const messagesMap = new Map();

      // 1. Query Supabase DB for remote messages
      if (window.supabase && userId1 && userId2) {
        try {
          const { data, error } = await window.supabase
            .from('unimatch_chats')
            .select('*')
            .or(`and(sender_id.eq.${userId1},receiver_id.eq.${userId2}),and(sender_id.eq.${userId2},receiver_id.eq.${userId1})`)
            .order('created_at', { ascending: true });

          if (!error && data && data.length > 0) {
            data.forEach(m => {
              let decomp = m.text;
              if (!decomp && m.compressed_text) {
                decomp = this.decompressText(m.compressed_text);
              }
              messagesMap.set(m.id, {
                id: m.id,
                sender_id: m.sender_id,
                receiver_id: m.receiver_id,
                compressed_text: m.compressed_text,
                text: decomp || m.compressed_text || '',
                is_compressed: m.is_compressed !== false,
                created_at: m.created_at
              });
            });
          } else {
            // Try fallback table chat_messages
            const { data: fbData } = await window.supabase
              .from('chat_messages')
              .select('*')
              .or(`and(sender_id.eq.${userId1},receiver_id.eq.${userId2}),and(sender_id.eq.${userId2},receiver_id.eq.${userId1})`)
              .order('created_at', { ascending: true });

            if (fbData && fbData.length > 0) {
              fbData.forEach(m => {
                let decomp = m.text;
                if (!decomp && m.compressed_text) {
                  decomp = this.decompressText(m.compressed_text);
                }
                messagesMap.set(m.id, {
                  id: m.id,
                  sender_id: m.sender_id,
                  receiver_id: m.receiver_id,
                  compressed_text: m.compressed_text,
                  text: decomp || m.text || '',
                  is_compressed: true,
                  created_at: m.created_at
                });
              });
            }
          }
        } catch(e) {
          console.warn("Supabase fetch chats warning:", e);
        }
      }

      // 2. Merge local cache if any exists locally
      const localMsgs = this._getLocalMessages(userId1, userId2);
      localMsgs.forEach(m => {
        if (!messagesMap.has(m.id)) {
          messagesMap.set(m.id, m);
        }
      });

      const list = Array.from(messagesMap.values());
      list.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      return list;
    },

    _getStorageKey: function(id1, id2) {
      const pair = [id1, id2].sort().join('_');
      return `um_chat_store_${pair}`;
    },

    _getLocalMessages: function(id1, id2) {
      try {
        const key = this._getStorageKey(id1, id2);
        const stored = localStorage.getItem(key);
        if (!stored) return [];
        const rawList = JSON.parse(stored);
        return rawList.map(m => ({
          ...m,
          text: m.text || this.decompressText(m.compressed_text)
        }));
      } catch(e) {
        return [];
      }
    },

    _saveLocalMessage: function(id1, id2, msgObj) {
      try {
        const key = this._getStorageKey(id1, id2);
        const existing = this._getLocalMessages(id1, id2);
        existing.push(msgObj);
        localStorage.setItem(key, JSON.stringify(existing));
      } catch(e) {}
    }
  };

  window.LZCompressor = LZCompressor;
  window.UniMatchChatEngine = UniMatchChatEngine;
})(window);
