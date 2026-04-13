import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ShoppingItem } from '../types';

interface Props {
  item: ShoppingItem;
  onToggle: () => void;
  onDelete: () => void;
}

export default function ItemRow({ item, onToggle, onDelete }: Props) {
  return (
    <View style={styles.row}>
      <TouchableOpacity onPress={onToggle} style={styles.checkArea} activeOpacity={0.7}>
        <View style={[styles.checkbox, item.checked && styles.checkboxChecked]}>
          {item.checked && <Text style={styles.checkmark}>✓</Text>}
        </View>
        <Text style={[styles.text, item.checked && styles.textChecked]}>
          {item.text}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={onDelete} style={styles.deleteBtn} activeOpacity={0.7}>
        <Text style={styles.deleteText}>✕</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  checkArea: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  text: {
    fontSize: 16,
    color: '#1a1a1a',
    flex: 1,
  },
  textChecked: {
    textDecorationLine: 'line-through',
    color: '#aaa',
  },
  deleteBtn: {
    paddingLeft: 12,
    paddingVertical: 4,
  },
  deleteText: {
    fontSize: 16,
    color: '#ccc',
  },
});
