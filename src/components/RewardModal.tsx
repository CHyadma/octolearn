import { Modal } from 'react-native';
import { SafeScreen } from './SafeScreen';

import { streak } from '../domain/progress';
import { useProgress } from '../store/progressStore';
import { colors } from '../theme';
import { ResultView } from './ResultView';

interface Props {
  visible: boolean;
  xp: number;
  subtitle: string;
  /** Lessons finished in this chapter, for the progress card. */
  unitDone: number;
  unitTotal: number;
  onContinue: () => void;
}

/** Full-screen celebration after finishing a lesson. */
export function RewardModal({ visible, xp, subtitle, unitDone, unitTotal, onContinue }: Props) {
  const activity = useProgress((s) => s.activity);
  const days = streak(activity, new Date());
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onContinue} presentationStyle="fullScreen">
      <SafeScreen style={{ flex: 1, backgroundColor: colors.surface }}>
        {visible && (
          <ResultView
            success
            title="Гайхалтай амжилт!"
            subtitle={subtitle}
            xp={xp}
            xpTitle={xp > 0 ? 'Онооны урамшуулал' : 'Давтлага'}
            xpSubtitle={xp > 0 ? 'Хичээл амжилттай дууссан' : 'Энэ хичээлийн XP-г өмнө нь авсан'}
            stats={[
              {
                label: 'Бүлэг',
                icon: 'checkmark-done',
                color: colors.secondary,
                value: `${unitDone} / ${unitTotal}`,
                progress: unitTotal ? unitDone / unitTotal : 0,
              },
              {
                label: 'Цуврал',
                icon: 'flame',
                color: colors.tertiaryContainer,
                value: `${days}`,
                unit: 'өдөр',
                footnote: days > 0 ? 'Хадгалагдлаа! 🔥' : undefined,
              },
            ]}
            tip={`Маргааш дахин хичээллэж ${days + 1} өдрийн цувралаа бататгаарай!`}
            primary={{
              label: 'Үргэлжлүүлэх',
              onPress: onContinue,
              testID: 'reward-continue',
            }}
          />
        )}
      </SafeScreen>
    </Modal>
  );
}
