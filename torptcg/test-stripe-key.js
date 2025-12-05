// Quick test to verify your Stripe key
// Run this with: node test-stripe-key.js

require('dotenv').config();

async function testStripeKey() {
    const apiKey = process.env.STRIPE_SECRET_KEY;

    console.log('Testing Stripe API Key...');
    console.log('Key exists:', !!apiKey);
    console.log('Key length:', apiKey?.length);
    console.log('Key prefix:', apiKey?.substring(0, 12));
    console.log('Key has quotes:', apiKey?.includes('"') || apiKey?.includes("'"));
    console.log('Key has spaces:', apiKey?.includes(' '));

    if (!apiKey) {
        console.error('❌ No API key found in .env file');
        return;
    }

    try {
        const stripe = require('stripe')(apiKey.trim());

        // Try to retrieve account info (this will fail if key is invalid)
        const account = await stripe.balance.retrieve();
        console.log('✅ Stripe key is VALID!');
        console.log('Account currency:', account.available[0]?.currency);
    } catch (error) {
        console.error('❌ Stripe key is INVALID');
        console.error('Error:', error.message);
        console.error('Error type:', error.type);

        if (error.type === 'StripeAuthenticationError') {
            console.log('\n🔍 Possible issues:');
            console.log('1. The key might be from a deleted/restricted Stripe account');
            console.log('2. You might need to generate a new key');
            console.log('3. Check if you copied the entire key (no truncation)');
            console.log('\n📝 To get a new key:');
            console.log('1. Go to https://dashboard.stripe.com/test/apikeys');
            console.log('2. Click "Create secret key" or use an existing one');
            console.log('3. Copy the ENTIRE key (starts with sk_test_)');
        }
    }
}

testStripeKey();
