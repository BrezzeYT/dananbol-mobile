import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Linking,
  ScrollView,
} from 'react-native';
import { contactsStyles as s } from '../styles/ContactsView.styles';
import Svg, { Path, Circle } from 'react-native-svg';

const GlobeIcon: React.FC<{ size?: number; color?: string }> = ({
  size = 24,
  color = '#8ec0ed',
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="12" cy="12" r="10" />
    <Path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </Svg>
);

const BotIcon: React.FC<{ size?: number; color?: string }> = ({
  size = 24,
  color = '#ec9f19',
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M12 8V4H8" />
    <Path d="M2 14h2" />
    <Path d="M20 14h2" />
    <Path d="M15 13v2" />
    <Path d="M9 13v2" />
    <Path d="M6 6h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z" />
  </Svg>
);

const SendIcon: React.FC<{ size?: number; color?: string }> = ({
  size = 16,
  color = '#94a3b8',
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="m22 2-7 20-4-9-9-4z" />
    <Path d="m22 2-11 11" />
  </Svg>
);

export const ContactsView: React.FC = () => {
  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={s.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={s.title}>Контакты</Text>
      <Text style={s.subtitle}>Актуальные контакты проекта:</Text>

      <View style={s.list}>
        <TouchableOpacity
          style={s.card}
          onPress={() => Linking.openURL('https://a35.danabol.club/')}
          activeOpacity={0.7}
        >
          <View style={[s.iconWrap, s.iconGlobe]}>
            <GlobeIcon size={24} color="#8ec0ed" />
          </View>
          <View style={s.cardInfo}>
            <Text style={s.cardLabel}>Наш сайт</Text>
            <Text style={s.cardValue}>a35.danabol.club</Text>
          </View>
          <View style={s.cardAction}>
            <SendIcon size={16} color="#94a3b8" />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={s.card}
          onPress={() => Linking.openURL('https://telegram.me/danabol_inform_bot')}
          activeOpacity={0.7}
        >
          <View style={[s.iconWrap, s.iconBot]}>
            <BotIcon size={24} color="#ec9f19" />
          </View>
          <View style={s.cardInfo}>
            <Text style={s.cardLabel}>Информ-Бот</Text>
            <Text style={s.cardValue}>@danabol_inform_bot</Text>
          </View>
          <View style={s.cardAction}>
            <SendIcon size={16} color="#94a3b8" />
          </View>
        </TouchableOpacity>
      </View>

      <View style={s.footerBox}>
        <Text style={s.footerText}>
          Мы всегда на связи для поддержки и ответов на ваши вопросы.
        </Text>
      </View>
    </ScrollView>
  );
};
