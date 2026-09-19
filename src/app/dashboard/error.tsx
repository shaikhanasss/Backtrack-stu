'use client';

import { SegmentError } from '@/components/brand/segment-error';

export default function DashboardError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <SegmentError {...props} area="dashboard" />;
}
