import { Redirect } from 'expo-router';

/** Unknown links (or a host serving the web build from an unexpected path) go home. */
export default function NotFound() {
  return <Redirect href="/" />;
}
