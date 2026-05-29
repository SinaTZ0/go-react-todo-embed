import { useMemo } from "react";
import { type DescService } from "@bufbuild/protobuf";
import { createConnectTransport } from "@connectrpc/connect-web";
import { createClient, type Client } from "@connectrpc/connect";

// In development, target the separate Go port. In production, use the same origin.
const baseUrl = import.meta.env.DEV ? "http://localhost:8080" : window.location.origin;

const transport = createConnectTransport({
    baseUrl: baseUrl,
});

/**
* Get a promise client for the given service.
*/
export function useClient<T extends DescService>(service: T): Client<T> {
    // We memoize the client, so that we only create one instance per service.
    return useMemo(() => createClient(service, transport), [service]);
}
