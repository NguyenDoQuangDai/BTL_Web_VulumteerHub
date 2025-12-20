package org.volumteerhub.util;

public class StringUtil {
    public static <T extends Enum<T>> T getEnumFromString(String enumValue, Class<T> enumClass) {
        return Enum.valueOf(enumClass, enumValue.toUpperCase());
    }
}
