import { Redirect } from 'expo-router';
import { useAuthStore } from '../store/authStore';

export default function Index() {
    const { accessToken } = useAuthStore();

    // If we have a token, logic in _layout should send us to (tabs), 
    // but explicitly we want to default to (tabs) if authenticated, 
    // or logic will catch and send to (auth)/login

    return <Redirect href={accessToken ? "/(tabs)" : "/(auth)/login"} />;
}
