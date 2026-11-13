import { Platform } from 'react-native';

let Haptics: typeof import('expo-haptics') | null = null;

if (Platform.OS !== 'web') {
  try {
    Haptics = require('expo-haptics');
  } catch (err) {
    console.debug('Failed to load expo-haptics:', err);
  }
}

/**
 * Легкий тактильный щелчок (табы, фильтры, кнопки меню)
 */
export const hapticLight = (): void => {
  if (Haptics) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  }
};

/**
 * Средний отклик (добавление в корзину, изменение количества)
 */
export const hapticMedium = (): void => {
  if (Haptics) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
  }
};

/**
 * Плотный отклик (удаление товара, сброс)
 */
export const hapticHeavy = (): void => {
  if (Haptics) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
  }
};

/**
 * Сигнал успеха (заказ оформлен, баланс пополнен, вход выполнен)
 */
export const hapticSuccess = (): void => {
  if (Haptics) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  }
};

/**
 * Сигнал ошибки / предупреждения
 */
export const hapticError = (): void => {
  if (Haptics) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
  }
};

