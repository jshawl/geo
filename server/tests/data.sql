-- unrelated
COPY "public"."events" ("id", "created_at", "latitude", "longitude", "speed", "direction", "accuracy", "user_id") FROM stdin;
250	2019-07-04 15:05:27	1.234	-5.678	\N	\N	\N	\N
251	2019-07-04 15:05:27	4.321	-8.675	\N	\N	\N	\N
\.

-- unrelated