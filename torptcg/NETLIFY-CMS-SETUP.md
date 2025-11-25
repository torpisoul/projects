# TorpTCG - Netlify CMS Setup

## 🎯 What This Does

This setup allows you to manage products through a user-friendly admin interface at `/admin`. When you add, edit, or delete products, they're saved to your GitHub repository and automatically appear on your live site.

## 📋 Setup Steps

### 1. Install Dependencies (One-time)

```bash
npm install
```

### 2. Enable Netlify Identity & Git Gateway

1. Go to your Netlify dashboard: https://app.netlify.com
2. Select your `torptcg` site
3. Go to **Settings** → **Identity**
4. Click **Enable Identity**
5. Under **Registration preferences**, select "Invite only" (recommended)
6. Scroll down to **Services** → **Git Gateway** and click **Enable Git Gateway**

### 3. Add Yourself as an Admin User

1. In Netlify dashboard, go to **Identity** tab
2. Click **Invite users**
3. Enter your email address
4. Check your email and accept the invitation
5. Set your password

### 4. Deploy to Netlify

```bash
git add .
git commit -m "Add Netlify CMS setup"
git push origin main
```

### 5. Access the Admin Panel

Once deployed, visit: `https://your-site-name.netlify.app/admin`

Log in with the email/password you set up in step 3.

## 🎨 Using the Admin Panel

### Adding a Product

1. Go to `/admin`
2. Click **Products** in the sidebar
3. Click **New Product**
4. Fill in the fields:
   - **Title**: Product name
   - **Category**: singles, sealed, accessories, or prints
   - **Price**: Include currency (e.g., £45.00)
   - **Image**: Upload or paste URL
   - **Stock Status**: In Stock, Low Stock, Out of Stock, or Made to Order
   - **Description**: Optional product description
   - **Featured**: Toggle if this should be highlighted
5. Click **Publish**

### Editing a Product

1. Go to `/admin`
2. Click **Products**
3. Click on the product you want to edit
4. Make your changes
5. Click **Publish**

### Deleting a Product

1. Go to `/admin`
2. Click **Products**
3. Click on the product
4. Click **Delete entry**

## 🔧 How It Works

1. **Netlify CMS** provides the admin interface at `/admin`
2. Products are stored as **markdown files** in the `/products` folder
3. When you save a product, it **commits to GitHub**
4. Netlify **rebuilds the site** automatically
5. The build script (`build-products.js`) converts markdown files to `products-data.json`
6. Your website loads products from `products-data.json`

## 📁 File Structure

```
torptcg/
├── admin/
│   ├── index.html          # Admin panel entry point
│   └── config.yml          # CMS configuration
├── products/               # Product markdown files (managed by CMS)
│   └── *.md
├── images/
│   └── uploads/           # Uploaded product images
├── build-products.js      # Converts markdown to JSON
├── products-data.json     # Generated product data (auto-created)
├── netlify.toml           # Netlify configuration
└── package.json           # Node dependencies
```

## 🚀 Testing Locally

To test the build process locally:

```bash
npm run build
```

This will generate `products-data.json` from your markdown files.

## ⚠️ Important Notes

- The old `admin.html` file is no longer needed (you can delete it)
- Products are no longer stored in localStorage
- All changes are saved to GitHub and visible to everyone
- Make sure to keep your Netlify Identity login secure

## 🆘 Troubleshooting

**Can't log in to /admin?**
- Make sure you enabled Identity and Git Gateway in Netlify
- Check that you accepted the email invitation
- Try clearing your browser cache

**Products not showing up?**
- Check that the build completed successfully in Netlify
- Look at the Netlify deploy logs for errors
- Verify `products-data.json` was generated

**Images not uploading?**
- Make sure the `images/uploads` folder exists
- Check file size (Netlify has limits)
- Try using external image URLs instead

## 📞 Need Help?

Check the Netlify CMS documentation: https://www.netlifycms.org/docs/
