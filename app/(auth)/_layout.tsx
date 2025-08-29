import { CustomHeader } from '@/components/CustomHeader';
import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="welcome" 
        options={{ 
          title: 'Welcome',
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="login" 
        options={{ 
          title: 'Sign In',
          headerShown: true,
        }} 
      />
      <Stack.Screen 
        name="register" 
        options={{ 
          title: 'Create Account',
          headerShown: true,
        }} 
      />
      <Stack.Screen 
        name="region-selection" 
        options={{ 
          title: 'Choose Region',
          headerShown: true,
          header: (props) => <CustomHeader title={props.options.title as string} />,
        }} 
      />
      <Stack.Screen 
        name="work-type-selection" 
        options={{ 
          title: 'Choose Services',
          headerShown: true,
          header: (props) => <CustomHeader title={props.options.title as string} />,
          gestureEnabled: false,
        }} 
      />
      <Stack.Screen 
        name="emergency-fix" 
        options={{ 
          title: 'Emergency Fix',
          headerShown: true,
        }} 
      />
    </Stack>
  );
}