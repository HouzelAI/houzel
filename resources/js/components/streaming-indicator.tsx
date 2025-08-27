import { cn } from '@/lib/utils';
import { useStream } from '@laravel/stream-react';

interface StreamingIndicatorProps {
    id: string;
    className?: string;
}

export default function StreamingIndicator({ id, className }: StreamingIndicatorProps) {
    const { isFetching, isStreaming } = useStream('chat', { id });

    // if (isStreaming) {
    //     return <div className={cn('size-2 animate-pulse rounded-full bg-green-500', className)} />;
    // }

    if (isFetching) {
        return <div className={cn('size-2 animate-pulse rounded-full bg-yellow-500', className)} />;
    }

    return null;
}
