import { ComponentProps } from "react";
import { TextInput, View, Text, StyleSheet } from "react-native";
import { useTheme } from "../theme";

export const Field = ({ label, ...props }: { label: string } & ComponentProps<typeof TextInput>) => {
  const { colors } = useTheme();
  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.muted }]}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.muted}
        style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.muted }]}
        {...props}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 16,
  },
});
