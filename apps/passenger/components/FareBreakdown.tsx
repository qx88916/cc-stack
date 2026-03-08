/**
 * FareBreakdown Component
 * Displays itemized fare calculation with base fare, distance, time, surge, and tax
 */

import React from 'react';
import { Text, View } from 'react-native';

interface FareBreakdownProps {
  breakdown: {
    baseFare: number;
    distanceCharge: number;
    timeCharge: number;
    subtotal: number;
    surge: number;
    surgeMultiplier: number;
    tax: number;
    total: number;
  };
  currency?: string;
  distanceKm?: number;
  durationMinutes?: number;
}

const FareBreakdown: React.FC<FareBreakdownProps> = ({
  breakdown,
  currency = 'FJD',
  distanceKm,
  durationMinutes,
}) => {
  const formatMoney = (amount: number) => {
    // Fiji Dollar uses $ symbol, but we'll prepend currency code for clarity
    return `${currency} $${amount.toFixed(2)}`;
  };

  return (
    <View className="bg-white rounded-2xl shadow-md shadow-neutral-300 p-5">
      <Text className="text-lg font-JakartaSemiBold text-gray-800 mb-4">
        Fare Breakdown
      </Text>

      {/* Base Fare */}
      <View className="flex-row justify-between py-2">
        <Text className="text-sm font-JakartaMedium text-gray-600">
          Base Fare
        </Text>
        <Text className="text-sm font-JakartaSemiBold text-gray-800">
          {formatMoney(breakdown.baseFare)}
        </Text>
      </View>

      {/* Distance Charge */}
      <View className="flex-row justify-between py-2">
        <Text className="text-sm font-JakartaMedium text-gray-600">
          Distance{distanceKm ? ` (${distanceKm.toFixed(1)} km)` : ''}
        </Text>
        <Text className="text-sm font-JakartaSemiBold text-gray-800">
          {formatMoney(breakdown.distanceCharge)}
        </Text>
      </View>

      {/* Time Charge */}
      <View className="flex-row justify-between py-2">
        <Text className="text-sm font-JakartaMedium text-gray-600">
          Time{durationMinutes ? ` (${durationMinutes} min)` : ''}
        </Text>
        <Text className="text-sm font-JakartaSemiBold text-gray-800">
          {formatMoney(breakdown.timeCharge)}
        </Text>
      </View>

      {/* Surge (if applicable) */}
      {breakdown.surge > 0 && (
        <View className="flex-row justify-between py-2">
          <Text className="text-sm font-JakartaMedium text-amber-600">
            Surge ({breakdown.surgeMultiplier}x)
          </Text>
          <Text className="text-sm font-JakartaSemiBold text-amber-600">
            {formatMoney(breakdown.surge)}
          </Text>
        </View>
      )}

      {/* Tax (if applicable) */}
      {breakdown.tax > 0 && (
        <View className="flex-row justify-between py-2">
          <Text className="text-sm font-JakartaMedium text-gray-600">
            Tax
          </Text>
          <Text className="text-sm font-JakartaSemiBold text-gray-800">
            {formatMoney(breakdown.tax)}
          </Text>
        </View>
      )}

      {/* Divider */}
      <View className="border-t border-gray-200 my-3" />

      {/* Total */}
      <View className="flex-row justify-between">
        <Text className="text-base font-JakartaBold text-gray-800">
          Total
        </Text>
        <Text className="text-xl font-JakartaBold text-primary-600">
          {formatMoney(breakdown.total)}
        </Text>
      </View>

      {/* Surge Notice */}
      {breakdown.surge > 0 && (
        <View className="mt-3 p-3 bg-amber-50 rounded-lg">
          <Text className="text-xs font-JakartaMedium text-amber-700">
            ⚡ Higher demand in your area. Surge pricing is {breakdown.surgeMultiplier}x the normal rate.
          </Text>
        </View>
      )}
    </View>
  );
};

export default FareBreakdown;
