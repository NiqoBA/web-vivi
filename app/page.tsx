import { AlfaAuthProvider } from '@/components/AlfaAuthProvider';
import { AlfaHome } from '@/components/AlfaHome';

export default function HomePage() {
  return (
    <AlfaAuthProvider>
      <AlfaHome />
    </AlfaAuthProvider>
  );
}
