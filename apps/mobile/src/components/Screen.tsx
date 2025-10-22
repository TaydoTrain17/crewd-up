import { ReactNode } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { useTheme } from "../theme";

export const Screen = ({ children, scrollable = false }: { children: ReactNode; scrollable?: boolean }) => {
  const { colors } = useTheme();
  if (scrollable) {
    return (
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentInsetAdjustmentBehavior="automatic">
        {children}
      </ScrollView>
    );
  }
  return <View style={[styles.container, { backgroundColor: colors.background }]}>{children}</View>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
    gap: 16,
  },
});
