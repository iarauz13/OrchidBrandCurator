import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Link, Tabs } from 'expo-router';
import { Pressable } from 'react-native';

import { Colors } from '@/constants/Theme';
import { useUIStore } from '@/stores/useUIStore';

// You can explore the built-in icon families and icons on the web at https://icons.expo.fyi/
function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={28} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
  const { theme } = useUIStore();
  // Simple check for now - in a real app might need a hook to respond to store changes + system changes
  // For MVP assuming store has 'light' or 'dark' default from init
  // If 'system' we default to light for simplicity in this specific line or add logic
  const scheme = theme === 'system' ? 'light' : theme;
  const currentTheme = Colors[scheme] || Colors.light;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: currentTheme.tint,
        tabBarInactiveTintColor: currentTheme.tabIconDefault,
        tabBarStyle: {
          backgroundColor: currentTheme.background,
          borderTopColor: currentTheme.border,
        },
        headerStyle: {
          backgroundColor: currentTheme.background,
        },
        headerTitleStyle: {
          color: currentTheme.text,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Binders',
          tabBarIcon: ({ color }) => <TabBarIcon name="book" color={color} />,
          headerRight: () => (
            <Link href="/modal" asChild>
              <Pressable>
                {({ pressed }) => (
                  <FontAwesome
                    name="info-circle"
                    size={25}
                    color={currentTheme.text}
                    style={{ marginRight: 15, opacity: pressed ? 0.5 : 1 }}
                  />
                )}
              </Pressable>
            </Link>
          ),
        }}
      />
      <Tabs.Screen
        name="collections"
        options={{
          title: 'Collections',
          tabBarIcon: ({ color }) => <TabBarIcon name="folder-open" color={color} />,
        }}
      />
      <Tabs.Screen
        name="feed"
        options={{
          title: 'Feed',
          tabBarIcon: ({ color }) => <TabBarIcon name="newspaper-o" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <TabBarIcon name="user-circle" color={color} />,
        }}
      />
    </Tabs>
  );
}
