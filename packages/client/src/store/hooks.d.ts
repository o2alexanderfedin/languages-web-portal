import { type TypedUseSelectorHook } from "react-redux";
import type { RootState } from "./index";
export declare const useAppDispatch: () => import("redux-thunk").ThunkDispatch<{
    healthApi: import("@reduxjs/toolkit/query").CombinedState<{
        getHealth: import("@reduxjs/toolkit/query").QueryDefinition<void, import("@reduxjs/toolkit/query").BaseQueryFn<string | import("@reduxjs/toolkit/query").FetchArgs, unknown, import("@reduxjs/toolkit/query").FetchBaseQueryError, {}, import("@reduxjs/toolkit/query").FetchBaseQueryMeta>, never, import("@repo/shared").HealthResponse, "healthApi", unknown>;
    }, never, "healthApi">;
}, undefined, import("redux").UnknownAction> & import("redux").Dispatch<import("redux").UnknownAction>;
export declare const useAppSelector: TypedUseSelectorHook<RootState>;
