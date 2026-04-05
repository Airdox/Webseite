import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Linking,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { Colors, FontSizes, Spacing, BorderRadius } from '../theme/colors';
import { t } from '../utils/i18n';

const BookingSection = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    event: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!formData.name || !formData.email || !formData.message) {
      Alert.alert('Fehler', 'Bitte fülle alle Pflichtfelder aus.');
      return;
    }

    const subject = `Booking Anfrage: ${formData.event || 'General'}`;
    const body = `Name: ${formData.name}\nEmail: ${formData.email}\nEvent: ${formData.event}\n\n${formData.message}`;
    const mailto = `mailto:airdox82@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    Linking.openURL(mailto)
      .then(() => {
        setSubmitted(true);
        setFormData({ name: '', email: '', event: '', message: '' });
      })
      .catch(() => {
        Alert.alert('Fehler', 'E-Mail konnte nicht geöffnet werden.');
      });
  };

  const socialLinks = [
    { name: 'SoundCloud', url: 'https://soundcloud.com/airdox', icon: 'soundcloud' },
    { name: 'Mixcloud', url: 'https://www.mixcloud.com/Airdox/', icon: 'mixcloud' },
    { name: 'Instagram', url: 'https://instagram.com/airdox_bln', icon: 'instagram' },
  ];

  return (
    <View style={styles.section}>
      <LinearGradient
        colors={['#000000', '#100510', '#000000']}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.sectionLabel}>{t('booking.sectionLabel')}</Text>
          <Text style={styles.sectionTitle}>{t('booking.title')}</Text>
          <Text style={styles.sectionSubtitle}>{t('booking.subtitle')}</Text>
        </View>

        {/* Contact Info */}
        <View style={styles.infoBlock}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>{t('booking.emailLabel')}</Text>
            <TouchableOpacity onPress={() => Linking.openURL('mailto:airdox82@gmail.com')}>
              <Text style={styles.infoValue}>airdox82@gmail.com</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>{t('booking.basedLabel')}</Text>
            <Text style={styles.infoValueStatic}>{t('booking.basedValue')}</Text>
          </View>
        </View>

        {/* Social Buttons */}
        <View style={styles.socialRow}>
          {socialLinks.map((link) => (
            <TouchableOpacity
              key={link.name}
              style={styles.socialBtn}
              onPress={() => Linking.openURL(link.url)}
              activeOpacity={0.7}
            >
              <Text style={styles.socialBtnText}>{link.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Form */}
        {submitted ? (
          <View style={styles.successCard}>
            <Text style={styles.successIcon}>✓</Text>
            <Text style={styles.successTitle}>{t('booking.successTitle')}</Text>
            <Text style={styles.successBody}>{t('booking.successBody')}</Text>
            <TouchableOpacity
              style={styles.newMsgBtn}
              onPress={() => setSubmitted(false)}
            >
              <LinearGradient
                colors={[Colors.neonPink, Colors.neonCyan]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.newMsgGradient}
              >
                <Text style={styles.newMsgText}>{t('booking.newMessage')}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>{t('booking.formTitle')}</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('booking.name')} *</Text>
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholderTextColor={Colors.textDim}
                selectionColor={Colors.neonCyan}
              />
              <View style={styles.inputLine} />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('booking.email')} *</Text>
              <TextInput
                style={styles.input}
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor={Colors.textDim}
                selectionColor={Colors.neonCyan}
              />
              <View style={styles.inputLine} />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('booking.event')}</Text>
              <TextInput
                style={styles.input}
                value={formData.event}
                onChangeText={(text) => setFormData({ ...formData, event: text })}
                placeholderTextColor={Colors.textDim}
                selectionColor={Colors.neonCyan}
              />
              <View style={styles.inputLine} />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('booking.message')} *</Text>
              <TextInput
                style={[styles.input, styles.textarea]}
                value={formData.message}
                onChangeText={(text) => setFormData({ ...formData, message: text })}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                placeholderTextColor={Colors.textDim}
                selectionColor={Colors.neonCyan}
              />
              <View style={styles.inputLine} />
            </View>

            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} activeOpacity={0.8}>
              <LinearGradient
                colors={[Colors.neonPink, Colors.neonCyan]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.submitGradient}
              >
                <Text style={styles.submitText}>{t('booking.submit')}</Text>
                <Svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke={Colors.bgVoid} strokeWidth={2}>
                  <Path d="M22 2L11 13M22 2L15 22L11 13L2 9L22 2Z" />
                </Svg>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    paddingVertical: Spacing.section,
    position: 'relative',
  },
  container: {
    paddingHorizontal: Spacing.base,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  sectionLabel: {
    fontFamily: 'monospace',
    fontSize: FontSizes.xs,
    color: Colors.neonCyan,
    letterSpacing: 3,
    marginBottom: Spacing.base,
    opacity: 0.8,
  },
  sectionTitle: {
    fontSize: FontSizes.xxxl,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.base,
  },
  sectionSubtitle: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  infoBlock: {
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  infoItem: {
    marginBottom: Spacing.md,
  },
  infoLabel: {
    fontFamily: 'monospace',
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    letterSpacing: 2,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: FontSizes.md,
    color: Colors.neonCyan,
    fontWeight: '600',
  },
  infoValueStatic: {
    fontSize: FontSizes.md,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  socialRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.xxl,
    flexWrap: 'wrap',
  },
  socialBtn: {
    borderWidth: 1,
    borderColor: Colors.borderMedium,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  socialBtnText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  formCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    padding: Spacing.lg,
  },
  formTitle: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  inputLabel: {
    fontFamily: 'monospace',
    fontSize: FontSizes.xs,
    color: Colors.neonCyan,
    letterSpacing: 1,
    marginBottom: Spacing.sm,
  },
  input: {
    fontSize: FontSizes.base,
    color: Colors.textPrimary,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 0,
  },
  textarea: {
    minHeight: 100,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
  },
  inputLine: {
    height: 1,
    backgroundColor: Colors.borderMedium,
  },
  submitBtn: {
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
    marginTop: Spacing.base,
  },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.sm,
  },
  submitText: {
    fontSize: FontSizes.sm,
    fontWeight: '700',
    color: Colors.bgVoid,
    letterSpacing: 1,
  },
  successCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    padding: Spacing.xxl,
    alignItems: 'center',
  },
  successIcon: {
    fontSize: 48,
    color: Colors.neonCyan,
    marginBottom: Spacing.base,
  },
  successTitle: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  successBody: {
    fontSize: FontSizes.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  newMsgBtn: {
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
  },
  newMsgGradient: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.sm,
  },
  newMsgText: {
    fontSize: FontSizes.sm,
    fontWeight: '700',
    color: Colors.bgVoid,
    letterSpacing: 1,
    textAlign: 'center',
  },
});

export default BookingSection;
