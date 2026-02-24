/**
 * privacy.tsx — Privacy Policy Screen
 *
 * Required by:
 *   - Apple App Store (mandatory for apps using Sign in with Apple / Google OAuth)
 *   - Google Play Store (mandatory for apps requesting permissions or using OAuth)
 *   - Google Cloud Console (must provide a URL when configuring OAuth client)
 *
 * Once you have a domain/website, host the contents of this screen at:
 *   https://yourdomain.com/privacy  (or use a free host like GitHub Pages)
 * Then paste that URL into:
 *   - Google Cloud Console → OAuth consent screen → Privacy Policy URL
 *   - App Store Connect → App Information → Privacy Policy URL
 *   - Google Play Console → Store listing → Privacy Policy
 */
import { ScrollView, View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { YT } from '../lib/theme'

const LAST_UPDATED = 'February 2026'
const CONTACT_EMAIL = 'support@carnaticapp.music'  // update when you have a domain

export default function PrivacyPolicy() {
  const router = useRouter()

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={YT.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.updated}>Last updated: {LAST_UPDATED}</Text>

        <Section title="Overview">
          Carnatic ("we", "our", or "us") is a mobile application that helps users discover
          Carnatic classical music through curated YouTube videos. We take your privacy seriously.
          This policy explains what data we collect, how we use it, and your choices.
        </Section>

        <Section title="Information We Collect">
          <Bold>1. Account information (optional)</Bold>{'\n'}
          If you sign in with Google, we receive your name and email address from Google.
          You can use the app without signing in — no account is required.{'\n\n'}

          <Bold>2. Watch history (signed-in users only)</Bold>{'\n'}
          We store which videos you've watched and for how long, so we can personalise
          recommendations. This data is stored in our secure database (Supabase) and is
          never sold to third parties.{'\n\n'}

          <Bold>3. Usage data</Bold>{'\n'}
          We collect anonymised app usage data (screens visited, searches performed) to
          improve the app. This data is not linked to your identity.
        </Section>

        <Section title="YouTube API Data">
          This app uses the YouTube Data API to fetch and display videos. By using this app,
          you also agree to{' '}
          <Text style={styles.link}>Google's Privacy Policy</Text>
          {' '}(https://policies.google.com/privacy).{'\n\n'}
          We do not store full YouTube video data beyond what is necessary for caching and
          recommendations. Video playback happens directly via YouTube's embedded player.
        </Section>

        <Section title="How We Use Your Information">
          • To provide personalised video recommendations based on your watch history{'\n'}
          • To remember your preferences and continue playback where you left off{'\n'}
          • To improve search relevance and app performance{'\n'}
          • We do NOT sell your data to advertisers or third parties
        </Section>

        <Section title="Data Retention">
          • Watch history is retained for 12 months and then deleted automatically{'\n'}
          • If you delete your account, all your data is permanently deleted within 30 days{'\n'}
          • Anonymous usage analytics are retained for up to 24 months
        </Section>

        <Section title="Your Rights">
          You have the right to:{'\n'}
          • Access the personal data we hold about you{'\n'}
          • Request deletion of your account and associated data{'\n'}
          • Opt out of personalised recommendations (by using the app without signing in){'\n\n'}
          To exercise these rights, email us at {CONTACT_EMAIL}
        </Section>

        <Section title="Children's Privacy">
          This app is designed for use by music students of all ages, including children.
          We do not knowingly collect personal information from children under 13 without
          parental consent. If you believe we have inadvertently collected information from
          a child, please contact us immediately.
        </Section>

        <Section title="Security">
          Your data is stored securely on Supabase (hosted on AWS), which provides
          encryption at rest and in transit. We use industry-standard security practices.
        </Section>

        <Section title="Changes to This Policy">
          We may update this policy from time to time. We'll notify you of significant
          changes through the app. Continued use after changes constitutes acceptance.
        </Section>

        <Section title="Contact Us">
          If you have any questions about this privacy policy, please email:{'\n'}
          {CONTACT_EMAIL}
        </Section>

        <View style={styles.footer}>
          <Text style={styles.footerText}>© 2026 Carnatic App. All rights reserved.</Text>
        </View>
      </ScrollView>
    </View>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.body}>{children}</Text>
    </View>
  )
}

function Bold({ children }: { children: string }) {
  return <Text style={styles.bold}>{children}</Text>
}

const styles = StyleSheet.create({
  container: {
    flex:            1,
    backgroundColor: YT.bg,
    paddingTop:      56,
  },
  header: {
    flexDirection: 'row',
    alignItems:    'center',
    paddingHorizontal: 14,
    paddingBottom:     12,
    borderBottomWidth: 1,
    borderBottomColor: YT.border,
    gap: 12,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    color:      YT.textPrimary,
    fontSize:   17,
    fontWeight: '600',
  },
  scroll: { flex: 1 },
  content: {
    padding:       20,
    paddingBottom: 60,
  },
  updated: {
    color:    YT.textTertiary,
    fontSize: 12,
    marginBottom: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color:      YT.textPrimary,
    fontSize:   16,
    fontWeight: '700',
    marginBottom: 8,
  },
  body: {
    color:      YT.textSecondary,
    fontSize:   14,
    lineHeight: 22,
  },
  bold: {
    color:      YT.textPrimary,
    fontWeight: '600',
  },
  link: {
    color:           YT.red,
    textDecorationLine: 'underline',
  },
  footer: {
    paddingTop:   24,
    borderTopWidth: 1,
    borderTopColor: YT.border,
    alignItems:   'center',
  },
  footerText: {
    color:    YT.textTertiary,
    fontSize: 12,
  },
})
