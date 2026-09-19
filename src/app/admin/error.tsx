'use client';

import { SegmentError } from '@/components/brand/segment-error';

export default function AdminError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <SegmentError {...props} area="admin panel" />;
}
