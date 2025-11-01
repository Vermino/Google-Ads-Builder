# AI Copy Generation - Quick Start Guide

## 🚀 Get Started in 3 Minutes

### Step 1: Install Dependencies (if needed)
```bash
npm install
```

All AI dependencies are already included in package.json:
- `openai` - OpenAI GPT-4 API
- `@anthropic-ai/sdk` - Claude API
- `lucide-react` - Icons

### Step 2: Get an API Key

Choose **ONE** of these providers:

#### Option A: OpenAI (GPT-4)
1. Go to https://platform.openai.com/api-keys
2. Create a new API key
3. Copy the key (starts with `sk-...`)

#### Option B: Claude (Anthropic)
1. Go to https://console.anthropic.com/account/keys
2. Create a new API key
3. Copy the key (starts with `sk-ant-...`)

### Step 3: Run the Application
```bash
npm run dev
```

Open http://localhost:5173

### Step 4: Configure API Key

1. Click the **gear icon** (⚙️) in the Dashboard header
2. Paste your API key in the appropriate field
3. Click **"Test Connection"**
4. Click **"Save Settings"**

### Step 5: Generate Your First Ad Copy

1. Create a campaign (or open an existing one)
2. Create an ad group
3. Create an ad
4. In the Ad Builder, click **"Generate with AI"** button
   - Or press **Ctrl+G** (Windows) / **Cmd+G** (Mac)

5. Fill in the form:
   - **Business Description**: "Premium organic dog food delivery service"
   - **Keywords**: "organic dog food, healthy pets, premium"
   - **Tone**: Professional
   - Click **"Generate Ad Copy"**

6. Wait 10-15 seconds

7. Review the generated headlines and descriptions

8. Select the ones you like (checkboxes)

9. Click **"Use Selected"**

10. Done! The copy is now in your ad builder

---

## 🎯 Example Generation

### Input:
```
Business Description: Premium organic dog food delivery
Keywords: organic, healthy, premium, delivery
Tone: Professional
CTA: Order Today
```

### Output (Example):
**Headlines:**
- Premium Organic Dog Food
- Healthy Food for Happy Dogs
- Free Nationwide Delivery
- 100% Organic Ingredients
- Order Today & Save 20%
- Vet-Approved Dog Food
- Fresh Organic Dog Meals
- Made With Real Meat
- No Fillers or Additives
- Delivered to Your Door
- Subscription Plans Available
- Happy Dogs, Happy Owners
- Try Risk-Free Today
- Best Food for Your Dog
- Premium Quality Guaranteed

**Descriptions:**
- Get vet-approved organic dog food delivered to your door. 100% organic ingredients. Order now!
- Premium organic dog food with free nationwide delivery. Made with real meat. No fillers. Try today!
- Healthy, organic dog food your pet will love. Free shipping on all orders. Order today & save 20%!
- Fresh organic dog meals delivered monthly. Vet-approved ingredients. Cancel anytime. Start now!

---

## 💡 Pro Tips

### For Best Results:

1. **Be Specific**: Instead of "dog food", say "premium organic grain-free dog food for large breeds"

2. **Add Keywords**: Include your target keywords that people search for

3. **Use Advanced Options**:
   - Unique Selling Points: "Free shipping, 30-day guarantee, Made in USA"
   - Target Audience: "Dog owners who care about nutrition"

4. **Try Different Tones**:
   - **Professional**: "Vet-Approved Organic Dog Food"
   - **Casual**: "Your Dog Will Love This!"
   - **Urgent**: "Limited Time - 20% Off Today!"
   - **Friendly**: "Healthy Happy Dogs Start Here"

5. **Regenerate**: Not happy with the results? Click "Regenerate" for new variations

6. **Mix & Match**: Select different combinations and regenerate multiple times

---

## ⌨️ Keyboard Shortcuts

- **Ctrl/Cmd + G**: Open AI generation modal (in Ad Builder)
- **Enter**: Submit form (when not in textarea)
- **Escape**: Close modal
- **Tab**: Navigate form fields
- **Space**: Toggle checkbox selection

---

## 🔧 Troubleshooting

### "No API Key Configured" Warning
- Go to Settings (gear icon)
- Enter your OpenAI or Claude API key
- Click "Test Connection" then "Save Settings"

### "Authentication Failed" Error
- Check your API key is correct
- OpenAI keys start with `sk-`
- Claude keys start with `sk-ant-`
- Make sure you copied the entire key

### Generation Takes Too Long
- Check your internet connection
- Try the other AI provider (OpenAI vs Claude)
- Reduce the number of headlines/descriptions

### Generated Copy Over Character Limit
- This shouldn't happen due to validation
- If it does, manually edit the text to fit

### Modal Won't Open
- Make sure you're on the Ad Builder page
- Check that you've configured an API key in Settings
- Check browser console for errors (F12)

---

## 📊 What Gets Generated

### Headlines
- **Count**: 3-15 headlines (default: 15)
- **Length**: Maximum 30 characters each
- **Validation**:
  - No prohibited characters (< > { } [ ] \)
  - Max 2 exclamation marks
  - No all-caps spam
  - Google Ads compliant

### Descriptions
- **Count**: 2-4 descriptions (default: 4)
- **Length**: Maximum 90 characters each
- **Validation**: Same as headlines

### Character Count Colors
- 🟢 **Green** (0-80%): Safe zone
- 🟡 **Yellow** (80-95%): Getting close
- 🔴 **Red** (95-100%): At limit

---

## 💰 API Costs

### OpenAI (GPT-4 Turbo)
- Approximate cost: **$0.01 - $0.03 per generation**
- Depends on: complexity of request, number of items

### Claude (Sonnet 3.5)
- Approximate cost: **$0.01 - $0.02 per generation**
- Similar pricing to OpenAI

**Note**: These are rough estimates. Check current pricing on provider websites.

---

## 🔐 Security

### Current Setup (Development)
- API keys stored in browser localStorage
- Keys accessible to JavaScript
- **NOT recommended for production**

### Production Setup (Recommended)
1. Create a backend API proxy
2. Store API keys server-side only
3. Add authentication to your app
4. Add rate limiting per user
5. Use environment variables

**Never commit API keys to version control!**

---

## 🎨 Customization

### Change Default Settings

Edit `src/config/aiConfig.ts`:

```typescript
generation: {
  defaultHeadlineCount: 15,      // Change this
  defaultDescriptionCount: 4,     // Change this
  maxHeadlineLength: 30,          // Don't change (Google limit)
  maxDescriptionLength: 90,       // Don't change (Google limit)
  timeoutMs: 30000,              // Increase if slow connection
}
```

### Change AI Model

```typescript
openai: {
  model: 'gpt-4-turbo-preview',  // Change to gpt-4, gpt-3.5-turbo, etc.
  maxTokens: 500,
  temperature: 0.7,              // 0.0-1.0 (lower = more focused)
}
```

---

## 📱 Mobile Usage

### On Mobile Devices:
1. Full-screen modal for better experience
2. Touch-friendly checkboxes and buttons
3. Scrollable results lists
4. All features work the same

### Tips:
- Use landscape mode for easier form filling
- Keyboard shortcuts don't work on mobile
- Copy/paste works with long-press

---

## 🆘 Need Help?

### Common Questions

**Q: Can I use both OpenAI and Claude?**
A: Yes! Configure both API keys and switch between them in the generation modal.

**Q: Does this use my Google Ads account?**
A: No, this is a local campaign builder. You export to CSV and import to Google Ads.

**Q: Can I edit the generated copy?**
A: Yes! After adding to your ad, you can edit it like any manual headline/description.

**Q: Can I save templates?**
A: Not yet, but it's on the roadmap. For now, save common inputs in a notes app.

**Q: Is my data sent to OpenAI/Claude?**
A: Yes, your business description and keywords are sent to generate copy. Review their privacy policies.

---

## 🎯 Real-World Examples

### Example 1: E-commerce Store
```
Business: Online shoe store with free shipping
Keywords: shoes, sneakers, free shipping, online
Tone: Casual
CTA: Shop Now
USPs: Free shipping, 30-day returns, Price match guarantee
```

### Example 2: Local Service
```
Business: Same-day plumbing repairs in Denver
Keywords: plumber Denver, emergency plumbing, same day
Tone: Urgent
CTA: Call Now
USPs: 24/7 service, Licensed & insured, Same-day service
Audience: Denver homeowners with plumbing emergencies
```

### Example 3: SaaS Product
```
Business: Project management software for remote teams
Keywords: project management, team collaboration, remote work
Tone: Professional
CTA: Start Free Trial
USPs: No credit card required, Unlimited projects, Real-time sync
Audience: Remote team managers and project leads
```

---

## 🚀 Next Steps

1. **Generate your first batch** of ad copy
2. **Test different tones** to see what works best
3. **Try advanced options** for more control
4. **Regenerate multiple times** for variety
5. **Mix AI and manual** for best results
6. **Export and test** in Google Ads
7. **Track performance** and iterate

---

## 📚 Additional Resources

- [Full Documentation](AI_COPY_GENERATION_README.md)
- [Component Architecture](AI_COMPONENT_ARCHITECTURE.md)
- [OpenAI API Docs](https://platform.openai.com/docs)
- [Claude API Docs](https://docs.anthropic.com)
- [Google Ads Policies](https://support.google.com/adspolicy)

---

**Ready to generate amazing ad copy? Let's go! 🚀**
