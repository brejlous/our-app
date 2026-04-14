import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
} from 'react-native';
import { ItemUnit } from '../types';

const UNITS: ItemUnit[] = ['ks', 'g', 'kg', 'ml', 'l'];

interface Props {
  onAdd: (text: string, quantity: number | null, unit: ItemUnit | null) => void;
}

export default function AddItemBar({ onAdd }: Props) {
  const [text, setText] = useState('');
  const [quantityText, setQuantityText] = useState('');
  const [unit, setUnit] = useState<ItemUnit>('ks');

  function handleAdd() {
    const trimmed = text.trim();
    if (!trimmed) return;
    const quantity = quantityText.trim() ? parseFloat(quantityText) : null;
    onAdd(trimmed, quantity, quantity != null ? unit : null);
    setText('');
    setQuantityText('');
  }

  return (
    <View style={styles.wrapper}>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Přidat položku..."
          placeholderTextColor="#999"
          value={text}
          onChangeText={setText}
          onSubmitEditing={handleAdd}
          returnKeyType="done"
          blurOnSubmit={false}
        />
        <TouchableOpacity
          style={[styles.button, !text.trim() && styles.buttonDisabled]}
          onPress={handleAdd}
          disabled={!text.trim()}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>+</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.quantityRow}>
        <TextInput
          style={styles.quantityInput}
          placeholder="Množství"
          placeholderTextColor="#bbb"
          value={quantityText}
          onChangeText={setQuantityText}
          keyboardType="numeric"
          returnKeyType="done"
        />
        <View style={styles.unitRow}>
          {UNITS.map((u) => (
            <TouchableOpacity
              key={u}
              style={[styles.unitBtn, unit === u && quantityText ? styles.unitBtnActive : null]}
              onPress={() => setUnit(u)}
            >
              <Text style={[styles.unitBtnText, unit === u && quantityText ? styles.unitBtnTextActive : null]}>
                {u}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    gap: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1a1a1a',
  },
  button: {
    backgroundColor: '#2563eb',
    borderRadius: 10,
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#c7d7f8',
  },
  buttonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '400',
    lineHeight: 28,
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  quantityInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 14,
    color: '#1a1a1a',
    width: 90,
  },
  unitRow: {
    flexDirection: 'row',
    gap: 6,
    flex: 1,
  },
  unitBtn: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  unitBtnActive: {
    backgroundColor: '#2563eb',
  },
  unitBtnText: {
    fontSize: 13,
    color: '#aaa',
    fontWeight: '500',
  },
  unitBtnTextActive: {
    color: '#fff',
  },
});
