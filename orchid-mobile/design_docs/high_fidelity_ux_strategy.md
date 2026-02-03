# Orchid Brand Curator: Product Strategy & Engineering Specification

**Status**: Version 2.0 (Post-Expert Review)
**Author**: AntiGravity (Lead Engineer)
**Date**: 2026-02-03
**Target Platform**: iOS (Primary), Android (Feature Parity Goal)

---

## 1. Executive Summary
This document serves as the master blueprint for the **Orchid Brand Curator** mobile application. It bridges the gap between high-level "premium" design aspirations and concrete engineering execution.

**Core Goal**: To build a "stand-out" brand curation tool that differentiates itself through subconscious quality cues (fluid motion, tactile feedback) while solving a validated user need for organizing scattered digital brand discoveries.

---

## 2. Business Strategy

### 2.1. Opportunity & The "Why" (Jobs-to-be-Done)
Users currently rely on scattered screenshots, Instagram Saves, and Notes app lists to track brands they like.
*   **Primary Job**: "When I discover a brand I love, I want to save it with context so I can easily find or share it later when I'm ready to buy."
*   **Success Metric**: 60% of saved brands are re-engaged with within 30 days.

### 2.2. Target Audience
*   **The "Curator"**: A design-conscious individual (Gen Z/Millennial) who takes pride in "having taste." They track 10+ brands and share recommendations frequently.
*   **Market Size (SAM)**: ~5M "brand enthusiasts" in the US.

### 2.3. Monetization Model (Validation Required)
To ensure sustainability without compromising UX:
*   **Tier 1 (Free)**: Basic curation (up to 50 brands), standard app icon.
*   **Tier 2 (Pro - $4.99/mo)**: Unlimited brands, Custom "Mascot" icons, Home Screen Widgets, Cloud Sync.
*   **Revenue Goal**: Convert 5% of active users to Pro by Month 6.

---

## 3. UX Differentiation Strategy

### 3.1. Animations (The "Premium" Feel)
*   **Goal**: Eliminate "static" transitions.
*   **Tactics**:
    *   **Shared Element Transitions**: Images expand seamlessly from list to detail view.
    *   **Micro-interactions**: Buttons scale (`0.95x`) on press; Toggle switches rely on physics-based springs, not linear timing.

### 3.2. Mascots & Personality
*   **Concept**: A dynamic "Curator" character that appears during empty states and success moments to gamify the experience.
*   **Risk Mitigation**:
    *   **User Control**: User setting to `Disable Mascot` (persisted in local storage).
    *   **Frequency Cap**: strictly limited to "waiting" or "celebration" moments.

### 3.3. Widgets (Retention Loop)
*   **Goal**: Ensure ~150 daily impressions via Lock Screen and Home Screen presence.
*   **Strategy**: Show "Daily Inspiration" or "Last Saved Brand" to prompt re-entry.

---

## 4. Technical Architecture

### 4.1. Widget Implementation (Complex)
Since Expo does not natively support WidgetKit, we will use a **Config Plugin** approach to bridge native iOS code.

*   **Architecture**:
    *   **Data Layer**: `UserDefaults` with **App Groups** (`group.com.orchid.shared`) is required to share data between the main React Native app and the Swift Widget Extension.
    *   **Code Strategy**:
        ```swift
        // Swift (Widget)
        let sharedDefaults = UserDefaults(suiteName: "group.com.orchid.shared")
        let lastBrand = sharedDefaults?.string(forKey: "lastBrandData")
        ```
        ```javascript
        // React Native (Bridge)
        import { NativeModules } from 'react-native';
        const updateWidget = (data) => NativeModules.WidgetBridge.setData(data);
        ```

### 4.2. Animation System
We will build a reusable library of animated components to ensure consistency and performance.

*   **Stack**: `react-native-reanimated` (for UI thread performance) + `react-native-gesture-handler`.
*   **Component Spec**:
    *   `<ScalableButton />`: Wraps standard pressables with scale + haptic feedback.
    *   `<ParallaxHeader />`: For meaningful scroll interaction on Brand Detail screens.
    *   `<SharedElement />`: Custom wrapper for image transitions.

### 4.3. State Management & Data Flow
*   **Solution**: **Zustand** + **MMKV** (faster AsyncStorage).
*   **Stores**:
    *   `useBrandStore`: CRUD operations for brands.
    *   `useUIStore`: Theme, Mascot preferences, Animation Reduced Motion settings.
    *   `useAuthStore`: User session handling.

### 4.4. Assets & Performance
*   **Challenge**: Lottie files and custom fonts bloat bundle size.
*   **Strategy**:
    *   **Lazy Loading**: Load Mascot Lottie JSONs only when the `EmptyState` component mounts using `expo-asset`.
    *   **Compression**: All PNGs converted to WebP. Lottie files simplified to <50KB.
    *   **Android Parity**: Profile on low-end Android early. Use `ReduceMotion` API to disable complex transitions if FPS < 30.

---

## 5. Quality Assurance Plan

### 5.1. Testing Pyramid
*   **Unit Tests (Jest)**: Coverage for Utility functions (URL parsers), Zustand stores (state logic).
*   **Integration Tests (Maestro/Detox)**:
    *   "User can save a brand."
    *   "User can toggle Mascot setting."
*   **Manual QA**:
    *   **Android**: Test on Pixel 4a (mid-range optimization target).
    *   **iOS**: Verify 120Hz smoothness on iPhone Pro models.

---

## 6. Implementation Roadmap (8 Weeks)

### Phase 1: Foundation & Validation (Weeks 1-2)
*   [ ] **Business**: User Interviews (20 users) to validate "Jobs-to-be-Done".
*   [ ] **Tech**: Setup Repo, Zustand, Navigation (Expo Router), Theme System.
*   [ ] **Design**: Finalize Brand Identity & Mascot Concept Art.

### Phase 2: Core Loop MVP (Weeks 3-4)
*   [ ] **Feature**: "Add Brand" flow (Link Scraping + Manual Entry).
*   [ ] **Animation**: Implement `<ScalableButton>` and basic transitions.
*   [ ] **Check**: Performance profiling on Android.

### Phase 3: The "Juice" (Weeks 5-6)
*   [ ] **Assets**: Integrate specialized Lottie animations (Mascot).
*   [ ] **Widgets**: Build iOS Widget Extension & Native Bridge (High Complexity).
*   [ ] **Feature**: Haptics integration.

### Phase 4: Polish & Launch (Weeks 7-8)
*   [ ] **Marketing**: "Screenshot First" asset creation.
*   [ ] **QA**: Full regression testing & Bug fixes.
*   [ ] **Legal**: IP audit (Font usage, Fair Use disclaimer).
*   [ ] **Release**: App Store Submission.

---

## 7. Obstacles & Risk Mitigation
*   **Risk**: Widget development hits a wall with Expo limitations.
    *   *Mitigation*: Fallback to "In-App Only" notifications for V1, prioritize Widget for V1.1.
*   **Risk**: "Over-Gamification" annoys pro users.
    *   *Mitigation*: "Pro Mode" setting that strips all mascots/whimsy for a utilitarian interface.
*   **Risk**: Legal takedowns from Brands.
    *   *Mitigation*: Strong "Fair Use" disclaimers; immediate compliance mechanism for takedown requests.

---

## 8. Conclusion
We are moving away from a "style-over-substance" approach to a **value-first** product, wrapped in premium execution. The extended timeline reflects the reality of building high-quality software that respects platform constraints and business viability.
