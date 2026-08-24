# 💎 RevenueCat Dashboard Setup Guide — FitMetrics

## 📋 Overview

Unga app code-la **100% RevenueCat integration ready**! Ippo **dashboard-la products, entitlements, offerings** create pannanum.

---

## 🔑 Step 1: RevenueCat Account Login

1. **https://app.revenuecat.com** la login pannunga
2. Unga FitMetrics project select pannunga
3. **Settings → API Keys** poi:
   - **Android API Key**: `goog_kCRVFNDZejsPKkNuQIXmVdhNzcx` (copy pannunga)
   - Indha key `.env` file-la set pannunga

---

## 📦 Step 2: Create Products (4 Products)

**Left sidebar → Products → New** poi indha products create pannunga:

### Product 1: Premium Monthly
| Field | Value |
|-------|-------|
| **Product ID** | `premium_monthly` |
| **Type** | Subscription |
| **Display Name** | FitMetrics Pro (Monthly) |
| **Description** | Ad-free + AI Coach + Barcode Scanner + Heatmap |
| **Price** | $4.99 / month |

### Product 2: Premium Yearly
| Field | Value |
|-------|-------|
| **Product ID** | `premium_yearly` |
| **Type** | Subscription |
| **Display Name** | FitMetrics Pro (Yearly) |
| **Description** | Best value subscription! All Pro features for a full year. |
| **Price** | $29.99 / year |

### Product 3: Premium Lifetime
| Field | Value |
|-------|-------|
| **Product ID** | `premium_lifetime` |
| **Type** | Non-Consumable |
| **Display Name** | FitMetrics Pro (Lifetime) |
| **Description** | One-time payment. All Pro features unlocked forever. |
| **Price** | $79.99 (one-time) |

### Product 4: Remove Ads
| Field | Value |
|-------|-------|
| **Product ID** | `remove_ads` |
| **Type** | Non-Consumable |
| **Display Name** | Remove All Ads |
| **Description** | Lifetime ad-free experience across all screens. |
| **Price** | $4.99 (one-time) |

---

## 🔐 Step 3: Create Entitlements (2 Entitlements)

**Left sidebar → Entitlements → New** poi:

### Entitlement 1: Pro Access
| Field | Value |
|-------|-------|
| **Entitlement ID** | `pro_access` |
| **Display Name** | FitMetrics Pro Access |
| **Description** | Full access to all premium features |

**Grant to Products:** Select these 3 products:
- ✅ `premium_monthly`
- ✅ `premium_yearly`
- ✅ `premium_lifetime`

### Entitlement 2: Ads Removed
| Field | Value |
|-------|-------|
| **Entitlement ID** | `ads_removed` |
| **Display Name** | Ad-Free Experience |
| **Description** | Remove all banner, interstitial, and native ads |

**Grant to Products:** Select these 4 products:
- ✅ `premium_monthly`
- ✅ `premium_yearly`
- ✅ `premium_lifetime`
- ✅ `remove_ads`

---

## 🎁 Step 4: Create Offerings (1 Offering)

**Left sidebar → Offerings → New** poi:

### Default Offering
| Field | Value |
|-------|-------|
| **Offering ID** | `default` |
| **Display Name** | FitMetrics Pro |

**Add Packages to Offering:**

| Package ID | Package Type | Product |
|------------|-------------|---------|
| `monthly` | Monthly | `premium_monthly` |
| `annual` | Annual | `premium_yearly` |
| `lifetime` | Lifetime | `premium_lifetime` |
| `remove_ads_one_time` | Custom (Lifetime) | `remove_ads` |

> **Note:** App code-le `offering.availablePackages.find(p => p.packageType === 'ANNUAL')` auto-select aagum.

---

## ⚙️ Step 5: Google Play Store Connection

**Left sidebar → Projects → FitMetrics → Google Play** poi:

1. **Connect Google Play Store** click pannunga
2. Unga Google Play Console account la login pannunga
3. **FitMetrics** app select pannunga
4. **Service Account JSON** upload pannunga (Play Console > Setup > API access > Create service account)
5. **RevenueCat products-ah Google Play products-ku link** pannunga

> **Important:** Google Play Console-la Products create pannidunga:
> - Go to **Monetize > Products > In-app products**
> - Create products with **same IDs** as RevenueCat:
>   - `premium_monthly` (Subscription, $4.99/mo)
>   - `premium_yearly` (Subscription, $29.99/yr)
>   - `premium_lifetime` (In-app product, $79.99)
>   - `remove_ads` (In-app product, $4.99)

---

## 🔑 Step 6: .env File Update

Unga project root-la `.env` file update pannunga:

```env
# RevenueCat API Keys
EXPO_PUBLIC_REVENUECAT_ANDROID_KEY=goog_kCRVFNDZejsPKkNuQIXmVdhNzcx
EXPO_PUBLIC_REVENUECAT_IOS_KEY=appl_YOUR_IOS_KEY_HERE
```

> **Note:** Indha Android key already code-la default-a iruku. Dashboard-la key match aagudha-nu check pannunga.

---

## 🧪 Step 7: Testing

### Sandbox Testing (Android)
1. **RevenueCat Dashboard > Customers > Sandbox** poi
2. Test account create pannunga
3. App-la test account login pannunga
4. Purchase test pannunga

### Google Play Internal Testing
1. **Play Console > Testing > Internal testing** la test track create pannunga
2. App upload pannunga
3. Testers add pannunga
4. Real purchase test pannunga

---

## 📊 Revenue Flow Summary

```
User taps "Upgrade" → PaywallModal opens
    ↓
RevenueCat.getOfferings() → Fetches packages
    ↓
User selects package → RevenueCat.purchasePackage()
    ↓
Google Play billing → Payment processed
    ↓
RevenueCat webhook → Entitlement granted
    ↓
App: hasProAccess() = true → Features unlocked!
```

---

## ✅ Checklist

- [ ] RevenueCat account created
- [ ] 4 Products created (premium_monthly, premium_yearly, premium_lifetime, remove_ads)
- [ ] 2 Entitlements created (pro_access, ads_removed)
- [ ] Entitlements linked to products
- [ ] 1 Offering created (default) with packages
- [ ] Google Play Store connected
- [ ] Google Play products created with same IDs
- [ ] .env file updated with correct API keys
- [ ] Sandbox testing done

---

## 🐛 Common Issues

### "No offerings found"
- Dashboard-la Offering create pannidunga
- Products-ah Offering-la add pannidunga

### "Product not found"
- Google Play Console-la same product ID create pannidunga
- RevenueCat-ku Google Play sync aagudha-nu check pannunga

### "Entitlement not granted"
- Entitlements products-ku link pannidunga
- Offering-la correct packages select pannidunga

---

## 📞 Support

- RevenueCat Docs: https://docs.revenuecat.com
- RevenueCat Support: https://app.revenuecat.com/support

---

**Indha guide follow pannunga — 30 minutes-la setup mudiyum!** 🚀
