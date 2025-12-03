# Debugging JSONBin 502 Error

## Steps to Debug

1. **Check Netlify Dev Logs**
   - Look at the terminal running `netlify dev`
   - You should see console.log messages from the functions
   - Look for "Inventory function invoked" and any error messages

2. **Test the API Key Directly**
   Run this in PowerShell to test if your API key works:
   ```powershell
   $headers = @{
       "X-Access-Key" = "$2a$10$ECN7feFnPRGgVecg0Y.qo.sD4y5GnUixuGmdbKhiP2CaBJlJ1rO7a"
   }
   Invoke-RestMethod -Uri "https://api.jsonbin.io/v3/b/6927370eae596e708f7294be" -Headers $headers
   ```

3. **Check if .env is being loaded**
   Add this to the top of `netlify/functions/inventory.js` temporarily:
   ```javascript
   console.log('ENV CHECK:', {
       hasApiKey: !!process.env.JSONBIN_API_KEY,
       hasBinUrl: !!process.env.JSONBIN_INVENTORY_BIN
   });
   ```

4. **Restart Netlify Dev**
   - Stop: Ctrl+C
   - Start: `netlify dev`
   - Try accessing http://localhost:8888/.netlify/functions/inventory again

## Common Issues

### Issue: "Bin doesn't belong to your account"
- The API key doesn't have access to that bin
- Solution: Use the correct API key from your JSONBin account

### Issue: 502 Bad Gateway
- Function is crashing before returning a response
- Check Netlify Dev terminal for error messages
- Verify .env file is in the correct location (project root)

### Issue: .env not being loaded
- Netlify CLI might not be loading .env automatically
- Try using `netlify dev --env .env` explicitly
- Or set environment variables in `netlify.toml`

## Alternative: Use netlify.toml for local dev

Add this to `netlify.toml`:
```toml
[dev]
  [dev.env]
    JSONBIN_API_KEY = "$2a$10$ECN7feFnPRGgVecg0Y.qo.sD4y5GnUixuGmdbKhiP2CaBJlJ1rO7a"
    JSONBIN_INVENTORY_BIN = "https://api.jsonbin.io/v3/b/6927370eae596e708f7294be"
    CARD_INVENTORY_BIN_ID = "692e1a8443b1c97be9d1746c"
```

**Note**: Don't commit this to git if it contains real API keys!
