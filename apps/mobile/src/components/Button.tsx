import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from "react-native";
import { useTheme } from "../theme";

export const Button = ({
  label,
  onPress,
  disabled,
  variant = "primary",
  loading,
}: {
  label: string;
  onPress: () => void | Promise<void>;
  disabled?: boolean;
  variant?: "primary" | "secondary";
  loading?: boolean;
}) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      accessibilityRole="button"
      disabled={disabled || loading}
      onPress={onPress}
      style={[
        styles.button,
        {
          backgroundColor: variant === "primary" ? colors.primary : colors.surface,
          opacity: disabled ? 0.5 : 1,
          borderColor: variant === "primary" ? "transparent" : colors.muted,
        },
      ]}
    >
      {loading ? <ActivityIndicator color={colors.text} /> : <Text style={[styles.label, { color: colors.text }]}>{label}</Text>}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderWidth: 1,
    alignItems: "center",
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
  },
});
