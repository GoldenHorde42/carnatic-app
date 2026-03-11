/**
 * terms.tsx — Terms of Use Screen
 *
 * Required by YouTube API Services Developer Policy III.A.1:
 * "API Clients must state in their own terms of use that, by using those API Clients,
 *  users are agreeing to be bound by the YouTube Terms of Service."
 */
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { YT } from '../lib/theme'

const LAST_UPDATED  = 'March 2026'
const CONTACT_EMAIL = 'support@carnaticapp.org'

export default function TermsOfUse() {
  const router = useRouter()

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={YT.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terms of Use</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.updated}>Last updated: {LAST_UPDATED}</Text>

        <Section title="1. Acceptance of Terms">
          By downloading, installing, or using the Carnatic mobile application ("App"), you agree
          to be bound by these Terms of Use. If you do not agree, please do not use the App.
        </Section>

        {/* III.A.1 compliance — must explicitly bind users to YouTube ToS */}
        <Section title="2. YouTube Terms of Service">
          <Bold>The Carnatic App is Powered by YouTube.</Bold>
          {'\n\n'}
          By using this App, you agree to be bound by the{' '}
          <Text style={styles.link} onPress={() => Linking.openURL('https://www.youtube.com/t/terms')}>
            YouTube Terms of Service
          </Text>
          {' '}and{' '}
          <Text style={styles.link} onPress={() => Linking.openURL('https://policies.google.com/privacy')}>
            Google's Privacy Policy
          </Text>
          {'.\n\n'}
          This App uses the YouTube Data API v3 to discover and surface Carnatic music videos.
          All video playback is delivered through YouTube's embedded player. Your use of YouTube
          content within this App is subject to YouTube's Terms of Service.{'\n\n'}
          You can revoke the App's access to your Google account at any time via your{' '}
          <Text style={styles.link} onPress={() => Linking.openURL('https://security.google.com/settings/security/permissions')}>
            Google Security Settings
          </Text>.
        </Section>

        <Section title="3. Description of Service">
          {'Carnatic is a curated discovery platform for Carnatic classical music. The App allows you to:\n\n'}
          {'• Browse and search curated Carnatic music videos sourced via the YouTube Data API\n'}
          {'• Watch videos using YouTube\'s embedded player\n'}
          {'• Create an optional account to save watch history and liked videos\n'}
          {'• Receive personalised video recommendations (signed-in users only)\n\n'}
          The App does not host or stream video content. All videos are hosted and streamed by
          YouTube. We serve as a curated index and discovery layer.
        </Section>

        <Section title="4. User Accounts">
          {'Creating an account is optional. If you sign in using Google:\n\n'}
          {'• You authorise us to receive your name and email address from Google\n'}
          {'• You are responsible for activity under your account\n'}
          {'• You may delete your account at any time by contacting '}
          {CONTACT_EMAIL}
        </Section>

        <Section title="5. Acceptable Use">
          {'You agree not to:\n\n'}
          {'• Use the App to circumvent YouTube\'s Terms of Service\n'}
          {'• Download or reproduce video content in violation of YouTube\'s terms\n'}
          {'• Use automated tools to scrape or extract data from the App\n'}
          {'• Attempt to reverse-engineer or tamper with the App\n'}
          • Use the App for any illegal purpose
        </Section>

        <Section title="6. Intellectual Property">
          All Carnatic music videos displayed within the App remain the intellectual property
          of their respective creators and are subject to YouTube's copyright policies.{'\n\n'}
          "YouTube" is a trademark of Google LLC. "Powered by YouTube" attribution is used in
          accordance with{' '}
          <Text style={styles.link} onPress={() => Linking.openURL('https://developers.google.com/youtube/terms/branding-guidelines')}>
            YouTube's Branding Guidelines
          </Text>.
        </Section>

        <Section title="7. Disclaimers">
          The App is provided "as is". We do not guarantee the availability or accuracy of any
          video content, as content is served by YouTube and may be removed at any time without
          notice. To the maximum extent permitted by law, Carnatic App shall not be liable for
          any indirect, incidental, or consequential damages from your use of the App.
        </Section>

        <Section title="8. Privacy">
          Your use of the App is also governed by our{' '}
          <Text style={styles.link} onPress={() => router.push('/privacy')}>
            Privacy Policy
          </Text>
          , which is incorporated into these Terms by reference.
        </Section>

        <Section title="9. Changes to Terms">
          We may update these Terms from time to time. We will notify you of significant changes
          through the App or by email. Continued use after changes constitutes your acceptance.
        </Section>

        <Section title="10. Contact">
          {`Questions about these Terms?\n${CONTACT_EMAIL}`}
        </Section>

        <View style={styles.footer}>
          <Text style={styles.footerText}>© 2026 Carnatic App. All rights reserved.</Text>
          <TouchableOpacity onPress={() => router.push('/privacy')} style={{ marginTop: 8 }}>
            <Text style={styles.link}>Privacy Policy</Text>
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
