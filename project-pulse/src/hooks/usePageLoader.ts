import { useState, useEffect } from 'react';

export function usePageLoader() {
    const [loading, setLoading] = useState(false);

    const start = () => setLoading(true);
    const stop = () => setLoading(false);

    return { loading, start, stop };
}
