/**
 * privacy.tsx — Privacy Policy Screen (v3, March 2026)
 *
 * Updated to comply with YouTube API Services Developer Policies:
 *   III.A.2e — explains how user data is shared with internal/external parties
 *   III.A.2g — discloses device-level data storage (AsyncStorage/local storage)
 *   III.E.4a-g — states that YouTube statistics are refreshed within 30 days
 */
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { YT } from '../lib/theme'

const LAST_UPDATED  = 'March 2026'
const CONTACT_EMAIL = 'support@carnaticapp.org'

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
          This policy explains what data we collect, how we use it, how we share it, and your choices.{'\n\n'}
          You can use the Carnatic app without creating an account. An account is optional and only
          needed for personalised recommendations and saved playlists.{'\n\n'}
          By using this App you also agree to our{' '}
          <Text style={styles.link} onPress={() => router.push('/terms')}>
            Terms of Use
          </Text>.
        </Section>

        <Section title="Information We Collect">
          <Bold>1. Account information (optional)</Bold>{'\n'}
          If you sign in with Google, we receive your name and email address from Google.
          We do not receive your Google password.{'\n\n'}

          <Bold>2. Watch history (signed-in users only)</Bold>{'\n'}
          We store which videos you've watched so we can personalise recommendations.
          This data is never sold to third parties.{'\n\n'}

          <Bold>3. Liked videos (signed-in users only)</Bold>{'\n'}
          We store which videos you have liked so you can revisit them.{'\n\n'}

          <Bold>4. Search queries</Bold>{'\n'}
          We store anonymised search queries (stripped of any personally identifiable
          information) to improve search quality.{'\n\n'}

          <Bold>5. Usage analytics</Bold>{'\n'}
          We collect anonymised app usage data (screens visited, feature usage) to improve
          the product. This data is aggregated and not linked to your identity.
        </Section>

        <Section title="Device Storage and Local Data">
          {'The App stores the following information directly on your device:\n\n'}
          <Bold>Authentication session token</Bold>{' — '}
          {'when you sign in with Google, your session token is stored in your device\'s local storage (AsyncStorage) so you stay signed in between app sessions. This token does not contain your Google password.\n\n'}
          <Bold>User preferences</Bold>{' — '}
          {'app settings and your last-viewed tab may be cached locally on your device to improve responsiveness.\n\n'}
          We do not use browser cookies (the App is a native mobile application).
          You can clear this local data by signing out or uninstalling the App.
        </Section>

        <Section title="YouTube API Data">
          {'This app is '}
          <Bold>Powered by YouTube</Bold>
          {'. We use the YouTube Data API v3 to search for and display Carnatic music videos.\n\n'}
          By using this app, you also agree to{' '}
          <Text style={styles.link} onPress={() => Linking.openURL('https://policies.google.com/privacy')}>
            Google's Privacy Policy
          </Text>
          {' '}and the{' '}
          <Text style={styles.link} onPress={() => Linking.openURL('https://www.youtube.com/t/terms')}>
            YouTube Terms of Service
          </Text>
          {'.\n\n'}
          We cache basic video metadata (title, thumbnail URL, view count, duration) in our
          database to reduce API calls. We do not store video content — all playback happens
          through YouTube's embedded player.{'\n\n'}
          <Bold>30-day data refresh: </Bold>
          YouTube statistics (view counts, etc.) cached in our database are refreshed at least
          every 30 days, in accordance with YouTube API Services Developer Policies (III.E.4).
          Statistics that cannot be refreshed within 30 days are removed from our cache.{'\n\n'}
          You can revoke the App's access to YouTube data via your{' '}
          <Text style={styles.link} onPress={() => Linking.openURL('https://security.google.com/settings/security/permissions')}>
            Google Security Settings
          </Text>.
        </Section>

        <Section title="How We Use Your Information">
          {'• To provide personalised video recommendations based on your watch history\n'}
          {'• To remember your preferences within the app\n'}
          {'• To improve search relevance and app performance\n'}
          {'• To respond to your support requests\n\n'}
          We do NOT sell your data to advertisers or any third parties.
        </Section>

        <Section title="How We Share Your Information">
          {'We share your information only in the following limited circumstances:\n\n'}
          <Bold>YouTube / Google (external): </Bold>
          {'When you watch a video, your interaction is delivered through YouTube\'s embedded player. YouTube may collect viewing data per their own Privacy Policy. We do not control YouTube\'s data collection during playback.\n\n'}
          <Bold>Supabase (infrastructure): </Bold>
          {'We store your account information, watch history, and liked videos in our Supabase database (hosted on AWS). Supabase acts as a data processor and does not use your data for their own purposes.\n\n'}
          <Bold>Groq (AI search): </Bold>
          {'When you use natural language search, your anonymised query is sent to Groq\'s API for processing. Queries are stripped of personally identifiable information before transmission.\n\n'}
          <Bold>Legal requirements: </Bold>
          We may disclose your information if required by law or court order.
        </Section>

        <Section title="Data Retention">
          {'• Watch history is retained for 12 months and then deleted automatically\n'}
          {'• Liked videos are retained until you unlike them or delete your account\n'}
          {'• If you delete your account, all personal data is permanently deleted within 30 days\n'}
          {'• Anonymous analytics are retained for up to 24 months\n'}
          • YouTube statistics cached in our database are refreshed or deleted within 30 days
        </Section>

        <Section title="Children's Privacy">
          This app is designed for music students of all ages, including children.
          We do not knowingly collect personal information from children under 13 without
          parental consent. Users under 13 are encouraged to use the app without signing in —
          all core features work without an account.{'\n\n'}
          If you believe we have inadvertently collected information from a child under 13,
          please contact us immediately at {CONTACT_EMAIL}.
        </Section>

        <Section title="Your Rights">
          {'You have the right to:\n'}
          {'• Access the personal data we hold about you\n'}
          {'• Request correction of inaccurate data\n'}
          {'• Request deletion of your account and all associated data\n'}
          {'• Opt out of personalised recommendations (use the app without signing in)\n'}
          {'• Revoke Google sign-in access via your Google account settings\n\n'}
          To exercise any of these rights, email: {CONTACT_EMAIL}
        </Section>

        <Section title="Security">
          Your data is stored on Supabase (hosted on AWS), which provides encryption at rest
          (AES-256) and in transit (TLS 1.2+). We use Row-Level Security (RLS) policies to
          ensure users can only access their own data.
        </Section>

        <Section title="Changes to This Policy">
          We may update this policy from time to time. We'll notify you of significant
          changes through the app or by email. Continued use after changes constitutes acceptance.
        </Section>

        <Section title="Contact Us">
          {`If you have any questions about this privacy policy:\n${CONTACT_EMAIL}`}
        </Section>

        <View style={styles.footer}>
          <Text style={styles.footerText}>© 2026 Carnatic App. All rights reserved.</Text>
          <TouchableOpacity onPress={() => router.push('/terms')} style={{ marginTop: 8 }}>
            <Text style={styles.link}>Terms of Use</Text>
          </TouchableOpacity>
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
    color:           '#c084fc',
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
