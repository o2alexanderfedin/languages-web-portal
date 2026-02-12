export declare const store: import('@reduxjs/toolkit').EnhancedStore<
  {
    healthApi: import('@reduxjs/toolkit/query').CombinedState<
      {
        getHealth: import('@reduxjs/toolkit/query').QueryDefinition<
          void,
          import('@reduxjs/toolkit/query').BaseQueryFn<
            string | import('@reduxjs/toolkit/query').FetchArgs,
            unknown,
            import('@reduxjs/toolkit/query').FetchBaseQueryError,
            {},
            import('@reduxjs/toolkit/query').FetchBaseQueryMeta
          >,
          never,
          import('@repo/shared').HealthResponse,
          'healthApi',
          unknown
        >;
      },
      never,
      'healthApi'
    >;
  },
  import('redux').UnknownAction,
  import('@reduxjs/toolkit').Tuple<
    [
      import('redux').StoreEnhancer<{
        dispatch: import('redux-thunk').ThunkDispatch<
          {
            healthApi: import('@reduxjs/toolkit/query').CombinedState<
              {
                getHealth: import('@reduxjs/toolkit/query').QueryDefinition<
                  void,
                  import('@reduxjs/toolkit/query').BaseQueryFn<
                    string | import('@reduxjs/toolkit/query').FetchArgs,
                    unknown,
                    import('@reduxjs/toolkit/query').FetchBaseQueryError,
                    {},
                    import('@reduxjs/toolkit/query').FetchBaseQueryMeta
                  >,
                  never,
                  import('@repo/shared').HealthResponse,
                  'healthApi',
                  unknown
                >;
              },
              never,
              'healthApi'
            >;
          },
          undefined,
          import('redux').UnknownAction
        >;
      }>,
      import('redux').StoreEnhancer,
    ]
  >
>;
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
