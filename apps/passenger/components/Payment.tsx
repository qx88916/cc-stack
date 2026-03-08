import { SHADOW_SM } from '@/constants/theme'
import React from 'react'
import { Image, Text, View } from 'react-native'

import { icons } from '@/constants'

interface PaymentProps {
  fullName: string
  email: string
  amount: string
  driverId: number
  rideTime: number
}

const Payment = ({ amount }: PaymentProps) => {
  return (
    <View className="mt-5">
      <Text className="text-base font-JakartaBold text-neutral-800 mb-3">
        Payment Method
      </Text>

      <View
        className="flex-row items-center p-4 rounded-2xl mb-2 border border-primary-500 bg-primary-50"
        style={SHADOW_SM}
      >
        <View className="w-10 h-10 rounded-full items-center justify-center mr-3 bg-primary-500">
          <Image
            source={icons.dollar}
            className="w-5 h-5"
            tintColor="#fff"
            resizeMode="contain"
          />
        </View>
        <View className="flex-1">
          <Text className="text-sm font-JakartaBold text-neutral-800">Cash</Text>
          <Text className="text-xs font-JakartaMedium text-neutral-500">
            Pay driver in cash after trip
          </Text>
        </View>
        <View className="w-6 h-6 rounded-full bg-primary-500 items-center justify-center">
          <Image
            source={icons.checkmark}
            className="w-3 h-3"
            tintColor="#fff"
            resizeMode="contain"
          />
        </View>
      </View>

      <View className="flex-row items-center justify-between mt-3 px-1">
        <Text className="text-sm font-JakartaMedium text-neutral-500">
          Amount to pay
        </Text>
        <Text className="text-lg font-JakartaBold text-primary-500">
          FJD ${amount}
        </Text>
      </View>
    </View>
  )
}

export default Payment