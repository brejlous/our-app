import React, { useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { ShoppingItem } from '../types';

interface Props {
  item: ShoppingItem;
  onToggle: () => void;
  onDelete: () => void;
  onEditQuantity: () => void;
}

export default function SwipeableItemRow({ item, onToggle, onDelete, onEditQuantity }: Props) {
  const swipeableRef = useRef<Swipeable>(null);

  function handleDelete() {
    swipeableRef.current?.close();
    onDelete();
  }

  function renderRightActions(
    _progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) {
    const scale = dragX.interpolate({
      inputRange: [-80, 0],
      outputRange: [1, 0.5],
      extrapolate: 'clamp',
    });

    return (
      <View style={styles.deleteAction}>
        <Animated.Text style={[styles.deleteIcon, { transform: [{ scale }] }]}>
          🗑️
        </Animated.Text>
      </View>
    );
  }

  const hasQuantity = item.quantity != null && item.unit != null;

  return (
    <Swipeable
        ref={swipeableRef}
        renderRightActions={renderRightActions}
        rightThreshold={40}
        onSwipeableOpen={(direction) => {
          if (direction === 'left') return;
          handleDelete();
        }}
      >
        <View style={styles.row}>
          <TouchableOpacity
            style={styles.mainArea}
            onPress={onToggle}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, item.checked && styles.checkboxChecked]}>
              {item.checked && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={[styles.text, item.checked && styles.textChecked]}>
              {item.text}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onEditQuantity} style={styles.quantityArea} activeOpacity={0.6}>
            {hasQuantity ? (
              <Text style={[styles.quantityBadge, item.checked && styles.quantityChecked]}>
                {item.quantity} {item.unit}
              </Text>
            ) : (
              <Text style={styles.addQuantityBtn}>+</Text>
            )}
          </TouchableOpacity>
        </View>
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 14,
    paddingLeft: 16,
    paddingRight: 8,
    marginBottom: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  mainArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
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
  quantityArea: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 40,
    alignItems: 'center',
  },
  quantityBadge: {
    fontSize: 13,
    color: '#888',
    fontWeight: '500',
  },
  quantityChecked: {
    color: '#ccc',
  },
  addQuantityBtn: {
    fontSize: 18,
    color: '#c7d7f8',
    fontWeight: '400',
  },
  deleteAction: {
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    marginBottom: 8,
    borderRadius: 12,
  },
  deleteIcon: {
    fontSize: 22,
  },
});
