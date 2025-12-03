# Environment Variables Setup Guide

## Overview
This project uses environment variables to securely store API keys and configuration. **Never commit API keys to Git.**

## Local Development

1. Copy the example environment file:
   ```bash
   copy .env.example .env
   ```

2. Edit `.env` and add your actual API keys:
   ```
   JSONBIN_API_KEY=your_actual_api_key_here
   JSONBIN_INVENTORY_BIN=https://api.jsonbin.io/v3/b/your_bin_id
   ```

3. The `.env` file is gitignored and will not be committed.

## Netlify Deployment

### Setting Environment Variables in Netlify

1. Go to your Netlify dashboard
2. Select your site
3. Navigate to **Site Settings** > **Environment Variables**
4. Click **Add a variable** and add each of the following:

| Variable Name | Description | Example Value |
|--------------|-------------|---------------|
| `JSONBIN_API_KEY` | Your JSONBin API key | `$2a$10$...` |
| `JSONBIN_INVENTORY_BIN` | Inventory bin URL | `https://api.jsonbin.io/v3/b/6927370eae596e708f7294be` |
| `CARD_GALLERY_BIN` | Card gallery bin URL (optional) | `https://api.jsonbin.io/v3/b/...` |
| `CARD_INVENTORY_BIN` | Card inventory bin URL (optional) | `https://api.jsonbin.io/v3/b/...` |

5. Click **Save**
6. Redeploy your site for changes to take effect

### Getting Your JSONBin API Key

1. Go to [jsonbin.io](https://jsonbin.io/)
2. Sign in or create an account
3. Navigate to **API Keys** in your dashboard
4. Copy your API key
5. Add it to Netlify environment variables as shown above

## Verification

After setting environment variables:

1. **Local**: Run `netlify dev` and check that functions work
2. **Production**: Deploy to Netlify and test the live site
3. Check Netlify function logs for any "WARNING: JSONBIN_API_KEY not set" messages

## Security Notes

- ✅ API keys are stored in environment variables
- ✅ `.env` files are gitignored
- ✅ `config.js` no longer contains hardcoded keys
- ✅ All upload scripts should use environment variables
- ⚠️ Never commit files containing actual API keys
- ⚠️ Rotate API keys if accidentally exposed

## Troubleshooting

**Functions return errors about missing API key:**
- Verify environment variables are set in Netlify dashboard
- Redeploy the site after adding variables
- Check function logs for specific error messages

**Local development not working:**
- Ensure `.env` file exists in project root
- Verify `.env` contains correct API key format
- Restart `netlify dev` after changing `.env`
