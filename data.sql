--
-- PostgreSQL database dump
--

\restrict vKMXbrs07aVeleTb8wjDrTC7dogKPanCbDU5aVLrG7yayBfmOcRbLL2V13DjL3U

-- Dumped from database version 17.10
-- Dumped by pg_dump version 17.10

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, full_name, email, password, role, access_code, is_active, last_login, created_by, created_at, updated_at, phone) FROM stdin;
4	Fatima Sule	cashier@hamsaad.com	$2b$10$NWUuGhvPm0aJiLkVRUEO6O0R8YIjOQldWCp0UMe84BWP9oc5yrB8q	cashier	CSH-PKCA4	t	2026-08-26 13:51:22.254919	1	2026-08-05 15:16:05.092852	2026-08-05 15:16:05.092852	\N
1	Admin	admin@hamsaad.com	$2b$10$OvvM1SYn6tDxoGKa.C/qeO8Hy2pyDxctLLvbLS9DBgqthznpiYXZS	admin	ADMIN001	t	2026-08-30 09:07:00.950482	\N	2026-08-04 12:18:50.190621	2026-08-25 21:32:30.437015	445566788
2	Abubakar Musa	manager@hamsaad.com	$2b$10$St2fgtcVWPOxOKwIKxxmneGyg6dTb4c58tcZgH2jTtcvcQIGSY.Oy	manager	MGR-GODCU	t	2026-08-30 09:27:44.913359	1	2026-08-04 14:02:28.41392	2026-08-25 22:31:40.193204	3344221177
3	Yusuf Auwal	storekeeper@hamsaad.com	$2b$10$AeRWR1BRgYfkTNYQ0/d9..oGoTxIvpkieIU3VHWkEzf5t21x7YUZy	storekeeper	STK-RS202	t	2026-08-30 09:30:24.411386	1	2026-08-05 15:15:42.05492	2026-08-25 22:49:03.388878	6773899109
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.audit_logs (id, user_id, user_name, action, table_name, record_id, old_values, new_values, ip_address, created_at) FROM stdin;
1	1	System Administrator	LOGIN	users	1	\N	\N	\N	2026-08-04 12:43:43.079809
2	1	System Administrator	CREATE_USER	users	2	\N	{"role": "manager", "email": "manager@hamsaad.com", "full_name": "Abubakar Musa"}	\N	2026-08-04 14:02:28.424226
3	1	System Administrator	LOGIN	users	1	\N	\N	\N	2026-08-05 15:08:44.747087
4	1	System Administrator	CREATE_USER	users	3	\N	{"role": "storekeeper", "email": "storekeeper@hamsaad.com", "full_name": "Yusuf Ibrahim"}	\N	2026-08-05 15:15:42.061448
5	1	System Administrator	CREATE_USER	users	4	\N	{"role": "cashier", "email": "cashier@hamsaad.com", "full_name": "Fatima Sule"}	\N	2026-08-05 15:16:05.098362
6	1	System Administrator	CREATE_CLIENT	clients	1	\N	{"email": "alamin@gmail.com", "phone": "08012345678", "full_name": "Al-Amin Enterprises"}	\N	2026-08-05 15:16:14.319929
7	1	System Administrator	CREATE_PRODUCT	products	1	\N	{"name": "Total Quartz 5W-40", "brand_id": 1, "category_id": 1, "quantity_in_stock": 50}	\N	2026-08-05 16:25:30.787084
8	1	System Administrator	LOGIN	users	1	\N	\N	\N	2026-08-05 19:28:19.791764
9	1	System Administrator	CREATE_ORDER	orders	1	\N	{"client_id": 1, "orderNumber": "HMS-ORD-202608-0001", "totalAmount": 75000}	\N	2026-08-05 20:51:39.247182
10	1	System Administrator	LOGIN	users	1	\N	\N	\N	2026-08-05 21:09:29.216763
11	1	System Administrator	CREATE_ORDER	orders	2	\N	{"client_id": 1, "orderNumber": "HMS-ORD-202608-0002", "totalAmount": 375000}	\N	2026-08-05 21:29:12.480757
12	1	System Administrator	LOGIN	users	1	\N	\N	\N	2026-08-06 09:41:56.670897
13	2	Abubakar Musa	LOGIN	users	2	\N	\N	\N	2026-08-06 10:20:30.164321
14	2	Abubakar Musa	CONFIRM_ORDER	orders	2	\N	\N	\N	2026-08-06 10:21:21.701694
15	1	System Administrator	LOGIN	users	1	\N	\N	\N	2026-08-06 10:22:39.725686
16	3	Yusuf Ibrahim	LOGIN	users	3	\N	\N	\N	2026-08-06 10:23:18.194519
17	1	System Administrator	LOGIN	users	1	\N	\N	\N	2026-08-06 10:24:29.162253
18	1	System Administrator	LOGIN	users	1	\N	\N	\N	2026-08-06 10:43:01.699103
19	1	System Administrator	LOGIN	users	1	\N	\N	\N	2026-08-06 11:00:29.702662
20	2	Abubakar Musa	LOGIN	users	2	\N	\N	\N	2026-08-06 11:01:49.945582
21	2	Abubakar Musa	LOGIN	users	2	\N	\N	\N	2026-08-06 11:23:14.71436
22	2	Abubakar Musa	UPLOAD_SCANNED_WAYBILL	waybills	2	\N	{"file": "/uploads/1786011809840-544252491.pdf"}	\N	2026-08-06 11:23:29.91384
23	3	Yusuf Ibrahim	LOGIN	users	3	\N	\N	\N	2026-08-06 11:25:39.881009
24	3	Yusuf Ibrahim	RELEASE_GOODS	orders	2	\N	\N	\N	2026-08-06 11:26:02.989901
25	3	Yusuf Ibrahim	UPLOAD_SIGNED_WAYBILL	waybills	2	\N	{"file": "/uploads/1786011979989-926640365.pdf"}	\N	2026-08-06 11:26:20.05276
26	3	Yusuf Ibrahim	LOGIN	users	3	\N	\N	\N	2026-08-06 11:26:41.532584
27	1	System Administrator	LOGIN	users	1	\N	\N	\N	2026-08-06 11:26:52.287316
28	2	Abubakar Musa	LOGIN	users	2	\N	\N	\N	2026-08-06 11:27:52.506337
29	2	Abubakar Musa	APPROVE_WAYBILL	waybills	2	\N	\N	\N	2026-08-06 11:28:10.902486
30	1	System Administrator	LOGIN	users	1	\N	\N	\N	2026-08-06 11:29:12.887843
31	4	Fatima Sule	LOGIN	users	4	\N	\N	\N	2026-08-06 11:34:26.246845
32	1	System Administrator	LOGIN	users	1	\N	\N	\N	2026-08-06 11:40:36.309482
33	1	System Administrator	LOGIN	users	1	\N	\N	\N	2026-08-07 11:46:21.570838
34	1	System Administrator	CREATE_PRODUCT	products	2	\N	{"name": "Castrol Oil 2", "brand_id": "4", "category_id": "2", "quantity_in_stock": "149"}	\N	2026-08-07 11:47:55.39936
35	1	System Administrator	CREATE_PRODUCT	products	3	\N	{"name": "SH-04", "brand_id": "2", "category_id": "1", "quantity_in_stock": "120"}	\N	2026-08-07 11:49:25.306913
36	1	System Administrator	CREATE_BRAND	brands	5	\N	{"name": "Ammasco"}	\N	2026-08-07 11:50:20.201596
37	1	System Administrator	LOGIN	users	1	\N	\N	\N	2026-08-08 19:54:32.915667
38	1	System Administrator	CREATE_BRAND	brands	6	\N	{"name": "Oando"}	\N	2026-08-08 19:56:21.62174
39	1	System Administrator	CREATE_PRODUCT	products	4	\N	{"name": "Mobil ", "brand_id": "3", "category_id": "1", "quantity_in_stock": "500"}	\N	2026-08-08 19:58:47.332768
40	1	System Administrator	CREATE_CLIENT	clients	2	\N	{"email": "imginvestment@gmail.com", "phone": "08035078465", "full_name": "IMG"}	\N	2026-08-08 20:00:29.028093
41	1	System Administrator	CREATE_ORDER	orders	3	\N	{"client_id": 2, "orderNumber": "HMS-ORD-202608-0003", "totalAmount": 2615000}	\N	2026-08-08 20:01:17.695875
42	2	Abubakar Musa	LOGIN	users	2	\N	\N	\N	2026-08-08 20:02:20.717828
43	2	Abubakar Musa	CONFIRM_ORDER	orders	3	\N	\N	\N	2026-08-08 20:03:05.412143
44	2	Abubakar Musa	ADD_STOCK	products	1	\N	{"quantity": "50", "quantityAfter": 75, "quantityBefore": 25}	\N	2026-08-08 20:05:39.278682
45	3	Yusuf Ibrahim	LOGIN	users	3	\N	\N	\N	2026-08-08 20:06:03.383764
46	3	Yusuf Ibrahim	RELEASE_GOODS	orders	3	\N	\N	\N	2026-08-08 20:07:11.509869
47	3	Yusuf Ibrahim	UPLOAD_SIGNED_WAYBILL	waybills	3	\N	{"file": "/uploads/1786216055226-219638530.png"}	\N	2026-08-08 20:07:35.277828
48	1	System Administrator	LOGIN	users	1	\N	\N	\N	2026-08-08 20:08:12.177837
49	4	Fatima Sule	LOGIN	users	4	\N	\N	\N	2026-08-08 20:09:30.684267
50	1	System Administrator	LOGIN	users	1	\N	\N	\N	2026-08-08 20:11:33.722382
51	1	System Administrator	LOGIN	users	1	\N	\N	\N	2026-08-08 20:14:37.833324
52	1	System Administrator	CREATE_BRAND	brands	7	\N	{"name": "MRS OIL"}	\N	2026-08-08 20:16:16.691314
53	1	System Administrator	CREATE_PRODUCT	products	5	\N	{"name": "Hydraulic Dot 3", "brand_id": "3", "category_id": "6", "quantity_in_stock": "20"}	\N	2026-08-08 20:18:25.363323
54	1	System Administrator	ADD_STOCK	products	5	\N	{"quantity": "50", "quantityAfter": 70, "quantityBefore": 20}	\N	2026-08-08 20:18:59.681306
55	1	System Administrator	CREATE_CLIENT	clients	3	\N	{"email": "aspira@gmail.com", "phone": "09876543214", "full_name": "Aspira"}	\N	2026-08-08 20:20:13.022506
56	1	System Administrator	CREATE_ORDER	orders	4	\N	{"client_id": 3, "orderNumber": "HMS-ORD-202608-0004", "totalAmount": 46039200}	\N	2026-08-08 20:21:31.938943
57	2	Abubakar Musa	LOGIN	users	2	\N	\N	\N	2026-08-08 20:23:03.205717
58	2	Abubakar Musa	CONFIRM_ORDER	orders	4	\N	\N	\N	2026-08-08 20:23:59.639409
59	3	Yusuf Ibrahim	LOGIN	users	3	\N	\N	\N	2026-08-08 20:25:11.357362
60	3	Yusuf Ibrahim	RELEASE_GOODS	orders	4	\N	\N	\N	2026-08-08 20:25:55.538837
61	3	Yusuf Ibrahim	UPLOAD_SIGNED_WAYBILL	waybills	4	\N	{"file": "/uploads/1786217175946-889999992.png"}	\N	2026-08-08 20:26:15.983706
62	1	System Administrator	LOGIN	users	1	\N	\N	\N	2026-08-08 20:26:56.14052
63	1	System Administrator	LOGIN	users	1	\N	\N	\N	2026-08-10 15:17:56.156013
136	1	System Administrator	CREATE_PRODUCT	products	15	\N	{"name": "MAX6", "brand_id": "8", "category_id": "8", "quantity_in_stock": "1000"}	\N	2026-08-16 20:50:35.010084
64	1	System Administrator	UPDATE_PRODUCT	products	1	{"id": 1, "name": "Total Quartz 5W-40", "unit": "Litre", "brand_id": 1, "is_active": true, "cost_price": "12000.00", "created_at": "2026-08-05T15:25:30.730Z", "created_by": 1, "updated_at": "2026-08-08T19:07:11.509Z", "category_id": 1, "description": "Total Quartz engine oil 4 litres", "size_variant": "4L", "selling_price": "15000.00", "minimum_threshold": 10, "quantity_in_stock": 74}	{"id": 1, "name": "Total Quartz 5W-40", "unit": "Litre", "brand_id": 1, "is_active": true, "cost_price": "12000.00", "created_at": "2026-08-05T15:25:30.730Z", "created_by": 1, "updated_at": "2026-08-10T14:28:53.857Z", "category_id": 1, "description": "Total Quartz engine oil 4 litres", "size_variant": "4L", "selling_price": "15000.00", "minimum_threshold": 10, "quantity_in_stock": 74}	\N	2026-08-10 15:28:53.86529
65	1	System Administrator	UPDATE_PRODUCT	products	1	{"id": 1, "name": "Total Quartz 5W-40", "unit": "Litre", "brand_id": 1, "is_active": true, "cost_price": "12000.00", "created_at": "2026-08-05T15:25:30.730Z", "created_by": 1, "updated_at": "2026-08-10T14:28:53.857Z", "category_id": 1, "description": "Total Quartz engine oil 4 litres", "size_variant": "4L", "selling_price": "15000.00", "minimum_threshold": 10, "quantity_in_stock": 74}	{"id": 1, "name": "Total Quartz 5W-40", "unit": "Litre", "brand_id": 1, "is_active": true, "cost_price": "12000.00", "created_at": "2026-08-05T15:25:30.730Z", "created_by": 1, "updated_at": "2026-08-10T14:29:10.348Z", "category_id": 1, "description": "Total Quartz engine oil 4 litres", "size_variant": "4L", "selling_price": "15000.00", "minimum_threshold": 10, "quantity_in_stock": 74}	\N	2026-08-10 15:29:10.398344
66	1	System Administrator	UPDATE_PRODUCT	products	1	{"id": 1, "name": "Total Quartz 5W-40", "unit": "Litre", "brand_id": 1, "is_active": true, "cost_price": "12000.00", "created_at": "2026-08-05T15:25:30.730Z", "created_by": 1, "updated_at": "2026-08-10T14:29:10.348Z", "category_id": 1, "description": "Total Quartz engine oil 4 litres", "size_variant": "4L", "selling_price": "15000.00", "minimum_threshold": 10, "quantity_in_stock": 74}	{"id": 1, "name": "Total Quartz 5W-40", "unit": "Litre", "brand_id": 1, "is_active": true, "cost_price": "12000.00", "created_at": "2026-08-05T15:25:30.730Z", "created_by": 1, "updated_at": "2026-08-10T14:31:47.809Z", "category_id": 1, "description": "Total Quartz engine oil 4 litres", "size_variant": "4L", "selling_price": "15000.00", "minimum_threshold": 10, "quantity_in_stock": 74}	\N	2026-08-10 15:31:47.857793
67	1	System Administrator	UPDATE_PRODUCT	products	1	{"id": 1, "name": "Total Quartz 5W-40", "unit": "Litre", "brand_id": 1, "is_active": true, "cost_price": "12000.00", "created_at": "2026-08-05T15:25:30.730Z", "created_by": 1, "updated_at": "2026-08-10T14:31:47.809Z", "category_id": 1, "description": "Total Quartz engine oil 4 litres", "size_variant": "4L", "selling_price": "15000.00", "minimum_threshold": 10, "quantity_in_stock": 74}	{"id": 1, "name": "Total Quartz 5W-40", "unit": "Litre", "brand_id": 1, "is_active": false, "cost_price": "12000.00", "created_at": "2026-08-05T15:25:30.730Z", "created_by": 1, "updated_at": "2026-08-10T14:38:08.263Z", "category_id": 1, "description": "Total Quartz engine oil 4 litres", "size_variant": "4L", "selling_price": "15000.00", "minimum_threshold": 10, "quantity_in_stock": 74}	\N	2026-08-10 15:38:08.269813
68	1	System Administrator	UPDATE_PRODUCT	products	1	{"id": 1, "name": "Total Quartz 5W-40", "unit": "Litre", "brand_id": 1, "is_active": false, "cost_price": "12000.00", "created_at": "2026-08-05T15:25:30.730Z", "created_by": 1, "updated_at": "2026-08-10T14:38:08.263Z", "category_id": 1, "description": "Total Quartz engine oil 4 litres", "size_variant": "4L", "selling_price": "15000.00", "minimum_threshold": 10, "quantity_in_stock": 74}	{"id": 1, "name": "Total Quartz 5W-40", "unit": "Litre", "brand_id": 1, "is_active": true, "cost_price": "12000.00", "created_at": "2026-08-05T15:25:30.730Z", "created_by": 1, "updated_at": "2026-08-10T14:38:18.126Z", "category_id": 1, "description": "Total Quartz engine oil 4 litres", "size_variant": "4L", "selling_price": "15000.00", "minimum_threshold": 10, "quantity_in_stock": 74}	\N	2026-08-10 15:38:18.172472
69	1	System Administrator	UPDATE_PRODUCT	products	2	{"id": 2, "name": "Castrol Oil 2", "unit": "Litre", "brand_id": 4, "is_active": true, "cost_price": "14000.00", "created_at": "2026-08-07T10:47:55.378Z", "created_by": 1, "updated_at": "2026-08-07T10:47:55.378Z", "category_id": 2, "description": "Grease for smaller Cars", "size_variant": "10L", "selling_price": "17000.00", "minimum_threshold": 5, "quantity_in_stock": 149}	{"id": 2, "name": "Castrol Oil 2", "unit": "Litre", "brand_id": 4, "is_active": true, "cost_price": "14000.00", "created_at": "2026-08-07T10:47:55.378Z", "created_by": 1, "updated_at": "2026-08-10T16:30:40.111Z", "category_id": 2, "description": "Grease for smaller Cars", "size_variant": "10L", "selling_price": "16000.00", "minimum_threshold": 5, "quantity_in_stock": 149}	\N	2026-08-10 17:30:40.120019
70	1	System Administrator	UPDATE_PRODUCT	products	2	{"id": 2, "name": "Castrol Oil 2", "unit": "Litre", "brand_id": 4, "is_active": true, "cost_price": "14000.00", "created_at": "2026-08-07T10:47:55.378Z", "created_by": 1, "updated_at": "2026-08-10T16:30:40.111Z", "category_id": 2, "description": "Grease for smaller Cars", "size_variant": "10L", "selling_price": "16000.00", "minimum_threshold": 5, "quantity_in_stock": 149}	{"id": 2, "name": "Castrol Oil 2", "unit": "Litre", "brand_id": 4, "is_active": false, "cost_price": "14000.00", "created_at": "2026-08-07T10:47:55.378Z", "created_by": 1, "updated_at": "2026-08-10T16:30:58.962Z", "category_id": 2, "description": "Grease for smaller Cars", "size_variant": "10L", "selling_price": "16000.00", "minimum_threshold": 5, "quantity_in_stock": 149}	\N	2026-08-10 17:30:58.968017
71	1	System Administrator	UPDATE_PRODUCT	products	2	{"id": 2, "name": "Castrol Oil 2", "unit": "Litre", "brand_id": 4, "is_active": false, "cost_price": "14000.00", "created_at": "2026-08-07T10:47:55.378Z", "created_by": 1, "updated_at": "2026-08-10T16:30:58.962Z", "category_id": 2, "description": "Grease for smaller Cars", "size_variant": "10L", "selling_price": "16000.00", "minimum_threshold": 5, "quantity_in_stock": 149}	{"id": 2, "name": "Castrol Oil 2", "unit": "Litre", "brand_id": 4, "is_active": true, "cost_price": "14000.00", "created_at": "2026-08-07T10:47:55.378Z", "created_by": 1, "updated_at": "2026-08-10T16:31:25.140Z", "category_id": 2, "description": "Grease for smaller Cars", "size_variant": "10L", "selling_price": "16000.00", "minimum_threshold": 5, "quantity_in_stock": 149}	\N	2026-08-10 17:31:25.187143
72	1	System Administrator	LOGIN	users	1	\N	\N	\N	2026-08-11 14:16:04.904868
73	1	System Administrator	UPDATE_PRODUCT	products	1	{"id": 1, "name": "Total Quartz 5W-40", "unit": "Litre", "brand_id": 1, "is_active": true, "cost_price": "12000.00", "created_at": "2026-08-05T15:25:30.730Z", "created_by": 1, "updated_at": "2026-08-10T14:38:18.126Z", "category_id": 1, "description": "Total Quartz engine oil 4 litres", "size_variant": "4L", "selling_price": "15000.00", "minimum_threshold": 10, "quantity_in_stock": 74}	{"id": 1, "name": "Total Quartz 5W-40", "unit": "Litre", "brand_id": 1, "is_active": false, "cost_price": "12000.00", "created_at": "2026-08-05T15:25:30.730Z", "created_by": 1, "updated_at": "2026-08-11T13:16:40.401Z", "category_id": 1, "description": "Total Quartz engine oil 4 litres", "size_variant": "4L", "selling_price": "15000.00", "minimum_threshold": 10, "quantity_in_stock": 74}	\N	2026-08-11 14:16:40.406504
74	1	System Administrator	UPDATE_PRODUCT	products	1	{"id": 1, "name": "Total Quartz 5W-40", "unit": "Litre", "brand_id": 1, "is_active": false, "cost_price": "12000.00", "created_at": "2026-08-05T15:25:30.730Z", "created_by": 1, "updated_at": "2026-08-11T13:16:40.401Z", "category_id": 1, "description": "Total Quartz engine oil 4 litres", "size_variant": "4L", "selling_price": "15000.00", "minimum_threshold": 10, "quantity_in_stock": 74}	{"id": 1, "name": "Total Quartz 5W-40", "unit": "Litre", "brand_id": 1, "is_active": true, "cost_price": "12000.00", "created_at": "2026-08-05T15:25:30.730Z", "created_by": 1, "updated_at": "2026-08-11T13:16:47.005Z", "category_id": 1, "description": "Total Quartz engine oil 4 litres", "size_variant": "4L", "selling_price": "15000.00", "minimum_threshold": 10, "quantity_in_stock": 74}	\N	2026-08-11 14:16:47.012871
75	1	System Administrator	CREATE_PRODUCT	products	6	\N	{"name": "Ammasco 2T", "brand_id": "5", "category_id": "1", "quantity_in_stock": "120"}	\N	2026-08-11 14:21:56.26455
76	1	System Administrator	UPDATE_PRODUCT	products	6	{"id": 6, "name": "Ammasco 2T", "unit": "Litre", "brand_id": 5, "is_active": true, "cost_price": "12000.00", "created_at": "2026-08-11T13:21:56.248Z", "created_by": 1, "updated_at": "2026-08-11T13:21:56.248Z", "category_id": 1, "description": null, "size_variant": "1L", "selling_price": "15000.00", "minimum_threshold": 20, "quantity_in_stock": 120}	{"id": 6, "name": "Ammasco 2T", "unit": "Litre", "brand_id": 5, "is_active": false, "cost_price": "12000.00", "created_at": "2026-08-11T13:21:56.248Z", "created_by": 1, "updated_at": "2026-08-11T13:22:26.379Z", "category_id": 1, "description": null, "size_variant": "1L", "selling_price": "15000.00", "minimum_threshold": 20, "quantity_in_stock": 120}	\N	2026-08-11 14:22:26.390529
77	1	System Administrator	UPDATE_PRODUCT	products	6	{"id": 6, "name": "Ammasco 2T", "unit": "Litre", "brand_id": 5, "is_active": false, "cost_price": "12000.00", "created_at": "2026-08-11T13:21:56.248Z", "created_by": 1, "updated_at": "2026-08-11T13:22:26.379Z", "category_id": 1, "description": null, "size_variant": "1L", "selling_price": "15000.00", "minimum_threshold": 20, "quantity_in_stock": 120}	{"id": 6, "name": "Ammasco 2T", "unit": "Litre", "brand_id": 5, "is_active": true, "cost_price": "12000.00", "created_at": "2026-08-11T13:21:56.248Z", "created_by": 1, "updated_at": "2026-08-11T13:22:34.877Z", "category_id": 1, "description": null, "size_variant": "1L", "selling_price": "15000.00", "minimum_threshold": 20, "quantity_in_stock": 120}	\N	2026-08-11 14:22:34.882411
78	1	System Administrator	CREATE_PRODUCT	products	7	\N	{"name": "Mobil ENG", "brand_id": "3", "category_id": "7", "quantity_in_stock": "100"}	\N	2026-08-11 14:28:46.747749
79	1	System Administrator	CREATE_PRODUCT	products	8	\N	{"name": "Mobil Special", "brand_id": "3", "category_id": "7", "quantity_in_stock": "100"}	\N	2026-08-11 14:30:36.940216
80	1	System Administrator	CREATE_PRODUCT	products	9	\N	{"name": "Mobil special 2T", "brand_id": "3", "category_id": "7", "quantity_in_stock": "130"}	\N	2026-08-11 14:31:20.558021
81	1	System Administrator	CREATE_PRODUCT	products	10	\N	{"name": "Mobil Super 2000", "brand_id": "3", "category_id": "7", "quantity_in_stock": "120"}	\N	2026-08-11 14:32:55.808359
82	1	System Administrator	CREATE_PRODUCT	products	11	\N	{"name": "Mobil Super 3000", "brand_id": "3", "category_id": "7", "quantity_in_stock": "250"}	\N	2026-08-11 14:33:50.027612
83	1	System Administrator	CREATE_PRODUCT	products	12	\N	{"name": "Mobil Motor40", "brand_id": "3", "category_id": "7", "quantity_in_stock": "98"}	\N	2026-08-11 14:34:37.803635
84	1	System Administrator	CREATE_PRODUCT	products	13	\N	{"name": "Mobil 1", "brand_id": "3", "category_id": "7", "quantity_in_stock": "190"}	\N	2026-08-11 14:35:52.51322
85	1	System Administrator	CREATE_PRODUCT	products	14	\N	{"name": "Mobil 1 ESP", "brand_id": "3", "category_id": "7", "quantity_in_stock": "134"}	\N	2026-08-11 14:36:38.181711
86	1	System Administrator	LOGIN	users	1	\N	\N	\N	2026-08-11 22:21:26.355444
87	1	System Administrator	LOGIN	users	1	\N	\N	\N	2026-08-11 22:49:01.770224
88	1	System Administrator	UPDATE_PRODUCT	products	1	{"id": 1, "name": "Total Quartz 5W-40", "unit": "Litre", "brand_id": 1, "is_active": true, "cost_price": "12000.00", "created_at": "2026-08-05T15:25:30.730Z", "created_by": 1, "updated_at": "2026-08-11T13:16:47.005Z", "category_id": 1, "description": "Total Quartz engine oil 4 litres", "size_variant": "4L", "selling_price": "15000.00", "minimum_threshold": 10, "quantity_in_stock": 74}	{"id": 1, "name": "Total Quartz 5W-40", "unit": "Litre", "brand_id": 1, "is_active": false, "cost_price": "12000.00", "created_at": "2026-08-05T15:25:30.730Z", "created_by": 1, "updated_at": "2026-08-11T21:50:00.002Z", "category_id": 1, "description": "Total Quartz engine oil 4 litres", "size_variant": "4L", "selling_price": "15000.00", "minimum_threshold": 10, "quantity_in_stock": 74}	\N	2026-08-11 22:50:00.006773
89	1	System Administrator	REDUCE_STOCK	products	4	\N	{"reason": "Wrong entry correction", "quantity": 10, "quantityAfter": 420, "quantityBefore": 430}	\N	2026-08-11 22:50:22.766327
90	1	System Administrator	UPDATE_PRODUCT	products	1	{"id": 1, "name": "Total Quartz 5W-40", "unit": "Litre", "brand_id": 1, "is_active": false, "cost_price": "12000.00", "created_at": "2026-08-05T15:25:30.730Z", "created_by": 1, "updated_at": "2026-08-11T21:50:00.002Z", "category_id": 1, "description": "Total Quartz engine oil 4 litres", "size_variant": "4L", "selling_price": "15000.00", "minimum_threshold": 10, "quantity_in_stock": 74}	{"id": 1, "name": "Total Quartz 5W-40", "unit": "Litre", "brand_id": 1, "is_active": true, "cost_price": "12000.00", "created_at": "2026-08-05T15:25:30.730Z", "created_by": 1, "updated_at": "2026-08-11T21:51:29.097Z", "category_id": 1, "description": "Total Quartz engine oil 4 litres", "size_variant": "4L", "selling_price": "15000.00", "minimum_threshold": 10, "quantity_in_stock": 74}	\N	2026-08-11 22:51:29.128477
91	1	System Administrator	UPDATE_PRODUCT	products	5	{"id": 5, "name": "Hydraulic Dot 3", "unit": "Drum", "brand_id": 3, "is_active": true, "cost_price": "850000.00", "created_at": "2026-08-08T19:18:25.304Z", "created_by": 1, "updated_at": "2026-08-08T19:25:55.538Z", "category_id": 6, "description": null, "size_variant": "208", "selling_price": "899984.00", "minimum_threshold": 5, "quantity_in_stock": 20}	{"id": 5, "name": "Hydraulic Dot 3", "unit": "Drum", "brand_id": 3, "is_active": false, "cost_price": "850000.00", "created_at": "2026-08-08T19:18:25.304Z", "created_by": 1, "updated_at": "2026-08-11T22:17:33.999Z", "category_id": 6, "description": null, "size_variant": "208", "selling_price": "899984.00", "minimum_threshold": 5, "quantity_in_stock": 20}	\N	2026-08-11 23:17:34.007562
92	1	System Administrator	UPDATE_PRODUCT	products	5	{"id": 5, "name": "Hydraulic Dot 3", "unit": "Drum", "brand_id": 3, "is_active": false, "cost_price": "850000.00", "created_at": "2026-08-08T19:18:25.304Z", "created_by": 1, "updated_at": "2026-08-11T22:17:33.999Z", "category_id": 6, "description": null, "size_variant": "208", "selling_price": "899984.00", "minimum_threshold": 5, "quantity_in_stock": 20}	{"id": 5, "name": "Hydraulic Dot 3", "unit": "Drum", "brand_id": 3, "is_active": true, "cost_price": "850000.00", "created_at": "2026-08-08T19:18:25.304Z", "created_by": 1, "updated_at": "2026-08-11T22:17:43.030Z", "category_id": 6, "description": null, "size_variant": "208", "selling_price": "899984.00", "minimum_threshold": 5, "quantity_in_stock": 20}	\N	2026-08-11 23:17:43.034711
93	1	System Administrator	LOGIN	users	1	\N	\N	\N	2026-08-12 12:50:35.573839
94	1	System Administrator	CREATE_ORDER	orders	8	\N	{"client_id": 1, "itemCount": 2, "orderNumber": "HMS-INV-202608-0005", "totalAmount": 14679260}	\N	2026-08-12 13:44:12.617893
95	\N	CLIENT	UPLOAD_RECEIPT	invoices	9	\N	{"file": "/uploads/1786542651399_625544784.pdf", "order_id": "9"}	\N	2026-08-12 14:50:51.554714
96	1	System Administrator	APPROVE_PAYMENT	invoices	9	\N	{"payment_status": "paid"}	\N	2026-08-12 14:51:13.971962
97	\N	CLIENT	UPLOAD_RECEIPT	invoices	10	\N	{"file": "/uploads/1786544512410_300414386.png", "order_id": "10"}	\N	2026-08-12 15:21:52.647543
98	1	System Administrator	APPROVE_PAYMENT	invoices	10	\N	{"payment_status": "paid"}	\N	2026-08-12 15:23:37.923597
99	\N	CLIENT	UPLOAD_RECEIPT	invoices	11	\N	{"file": "/uploads/1786545567795_138449709.jpeg", "order_id": "11"}	\N	2026-08-12 15:39:27.814751
100	1	System Administrator	APPROVE_PAYMENT	invoices	11	\N	{"payment_status": "paid"}	\N	2026-08-12 15:40:45.922281
101	1	System Administrator	LOGIN	users	1	\N	\N	\N	2026-08-12 22:16:40.288208
102	1	System Administrator	CREATE_ORDER	orders	15	\N	{"client_id": 2, "itemCount": 2, "orderNumber": "HMS-INV-202608-0012", "totalAmount": 3403500}	\N	2026-08-12 22:44:00.553309
103	1	System Administrator	LOGIN	users	1	\N	\N	\N	2026-08-12 23:21:19.935142
104	1	System Administrator	SEND_PRICE_ALERT	price_alerts	\N	\N	{"sent_to": "All Clients", "alert_type": "brand", "brand_name": "Oando"}	\N	2026-08-12 23:31:46.29264
105	1	System Administrator	RESOLVE_COMPLAINT	complaints	6	\N	{"subject": "Item Expiry"}	\N	2026-08-12 23:32:52.890554
106	1	System Administrator	CREATE_ORDER	orders	16	\N	{"client_id": 3, "itemCount": 2, "orderNumber": "HMS-INV-202608-0013", "totalAmount": 1159500}	\N	2026-08-12 23:49:40.520705
107	1	System Administrator	UPLOAD_RECEIPT	invoices	13	\N	{"order_number": "HMS-INV-202608-0012", "uploaded_on_behalf": true}	\N	2026-08-12 23:51:06.765791
108	1	System Administrator	APPROVE_PAYMENT	orders	15	\N	{"client": "HMS-INV-202608-0012", "order_number": "HMS-INV-202608-0012"}	\N	2026-08-12 23:51:06.798505
109	1	System Administrator	UPLOAD_RECEIPT	invoices	2	\N	{"order_number": "HMS-ORD-202608-0002", "uploaded_on_behalf": true}	\N	2026-08-12 23:52:49.870729
110	1	System Administrator	APPROVE_PAYMENT	orders	2	\N	{"client": "HMS-ORD-202608-0002", "order_number": "HMS-ORD-202608-0002"}	\N	2026-08-12 23:52:49.893489
111	1	System Administrator	LOGIN	users	1	\N	\N	\N	2026-08-13 10:51:59.986743
112	1	System Administrator	LOGIN	users	1	\N	\N	\N	2026-08-14 10:15:45.154225
113	2	Abubakar Musa	LOGIN	users	2	\N	\N	\N	2026-08-14 14:47:04.073265
114	1	System Administrator	UPLOAD_RECEIPT	invoices	12	\N	{"order_number": "HMS-INV-202608-0011", "uploaded_on_behalf": true}	\N	2026-08-14 14:52:01.856949
115	1	System Administrator	APPROVE_PAYMENT	orders	14	\N	{"client": "HMS-INV-202608-0011", "order_number": "HMS-INV-202608-0011"}	\N	2026-08-14 14:52:01.887944
116	2	Abubakar Musa	CONFIRM_ORDER	orders	14	\N	{"status": "confirmed"}	\N	2026-08-14 15:28:11.143101
117	2	Abubakar Musa	CONFIRM_ORDER	orders	13	\N	{"status": "confirmed"}	\N	2026-08-14 15:29:07.267653
118	3	Yusuf Ibrahim	LOGIN	users	3	\N	\N	\N	2026-08-14 15:35:01.301424
119	3	Yusuf Ibrahim	ADD_STOCK	products	12	\N	{"quantity": "25", "quantityAfter": 123, "quantityBefore": 98}	\N	2026-08-14 15:42:46.655863
120	3	Yusuf Ibrahim	ADD_STOCK	products	4	\N	{"quantity": "20", "quantityAfter": 440, "quantityBefore": 420}	\N	2026-08-14 15:43:54.580799
121	3	Yusuf Ibrahim	LOGIN	users	3	\N	\N	\N	2026-08-14 16:19:58.209274
122	3	Yusuf Ibrahim	RELEASE_GOODS	orders	16	\N	{"status": "released"}	\N	2026-08-14 16:29:05.178978
123	3	Yusuf Ibrahim	RELEASE_GOODS	orders	13	\N	{"status": "released"}	\N	2026-08-14 16:55:53.232085
124	2	Abubakar Musa	LOGIN	users	2	\N	\N	\N	2026-08-14 17:09:12.895582
125	3	Yusuf Ibrahim	ADD_STOCK	products	4	\N	{"quantity": "5", "quantityAfter": 445, "quantityBefore": 440}	\N	2026-08-14 22:04:05.957544
126	1	System Administrator	LOGIN	users	1	\N	\N	\N	2026-08-14 22:10:54.34639
127	1	System Administrator	CREATE_CLIENT	clients	4	\N	{"clientId": "HMS-CLT-0004", "full_name": "Garba Karfe"}	\N	2026-08-14 22:28:06.644155
128	1	System Administrator	APPROVE_PAYMENT	orders	17	\N	{"client": "HMS-INV-202608-0014", "order_number": "HMS-INV-202608-0014"}	\N	2026-08-14 22:35:07.842339
129	2	Abubakar Musa	CONFIRM_ORDER	orders	17	\N	{"status": "confirmed"}	\N	2026-08-14 22:42:48.325749
130	3	Yusuf Ibrahim	RELEASE_GOODS	orders	17	\N	{"status": "released"}	\N	2026-08-14 22:43:24.751889
131	1	System Administrator	RESOLVE_COMPLAINT	complaints	7	\N	{"subject": "My order yet to arrive"}	\N	2026-08-14 22:47:53.965363
132	1	System Administrator	SEND_PRICE_ALERT	price_alerts	\N	\N	{"sent_to": "All Clients", "alert_type": "brand", "brand_name": "Castrol"}	\N	2026-08-14 22:48:43.540556
133	1	System Administrator	SEND_PRICE_ALERT	price_alerts	\N	\N	{"sent_to": "Garba Karfe", "alert_type": "product", "brand_name": null}	\N	2026-08-14 22:50:20.29588
134	1	System Administrator	LOGIN	users	1	\N	\N	\N	2026-08-16 20:32:31.645268
135	1	System Administrator	CREATE_BRAND	brands	8	\N	{"name": "BAOSE"}	\N	2026-08-16 20:49:42.955194
137	1	System Administrator	UPDATE_PRODUCT	products	15	{"id": 15, "name": "MAX6", "unit": "Litre", "brand_id": 8, "is_active": true, "cost_price": "20000.00", "created_at": "2026-08-16T19:50:34.995Z", "created_by": 1, "updated_at": "2026-08-16T19:50:34.995Z", "category_id": 8, "description": null, "size_variant": "1l", "selling_price": "22000.00", "minimum_threshold": 5, "quantity_in_stock": 1000}	{"id": 15, "name": "MAX6", "unit": "Litre", "brand_id": 8, "is_active": false, "cost_price": "20000.00", "created_at": "2026-08-16T19:50:34.995Z", "created_by": 1, "updated_at": "2026-08-16T19:51:18.929Z", "category_id": 8, "description": null, "size_variant": "1l", "selling_price": "22000.00", "minimum_threshold": 5, "quantity_in_stock": 1000}	\N	2026-08-16 20:51:18.937703
138	1	System Administrator	UPDATE_PRODUCT	products	15	{"id": 15, "name": "MAX6", "unit": "Litre", "brand_id": 8, "is_active": false, "cost_price": "20000.00", "created_at": "2026-08-16T19:50:34.995Z", "created_by": 1, "updated_at": "2026-08-16T19:51:18.929Z", "category_id": 8, "description": null, "size_variant": "1l", "selling_price": "22000.00", "minimum_threshold": 5, "quantity_in_stock": 1000}	{"id": 15, "name": "MAX6", "unit": "Litre", "brand_id": 8, "is_active": true, "cost_price": "20000.00", "created_at": "2026-08-16T19:50:34.995Z", "created_by": 1, "updated_at": "2026-08-16T19:51:42.027Z", "category_id": 8, "description": null, "size_variant": "1l", "selling_price": "22000.00", "minimum_threshold": 5, "quantity_in_stock": 1000}	\N	2026-08-16 20:51:42.034109
139	1	System Administrator	UPDATE_PRODUCT	products	12	{"id": 12, "name": "Mobil Motor40", "unit": "Litre", "brand_id": 3, "is_active": true, "cost_price": "19000.00", "created_at": "2026-08-11T13:34:37.794Z", "created_by": 1, "updated_at": "2026-08-14T21:43:24.751Z", "category_id": 7, "description": null, "size_variant": "1L", "selling_price": "23000.00", "minimum_threshold": 5, "quantity_in_stock": 114}	{"id": 12, "name": "Mobil Motor40", "unit": "Litre", "brand_id": 3, "is_active": false, "cost_price": "19000.00", "created_at": "2026-08-11T13:34:37.794Z", "created_by": 1, "updated_at": "2026-08-16T19:51:55.138Z", "category_id": 7, "description": null, "size_variant": "1L", "selling_price": "23000.00", "minimum_threshold": 5, "quantity_in_stock": 114}	\N	2026-08-16 20:51:55.185946
140	1	System Administrator	UPDATE_PRODUCT	products	12	{"id": 12, "name": "Mobil Motor40", "unit": "Litre", "brand_id": 3, "is_active": false, "cost_price": "19000.00", "created_at": "2026-08-11T13:34:37.794Z", "created_by": 1, "updated_at": "2026-08-16T19:51:55.138Z", "category_id": 7, "description": null, "size_variant": "1L", "selling_price": "23000.00", "minimum_threshold": 5, "quantity_in_stock": 114}	{"id": 12, "name": "Mobil Motor40", "unit": "Litre", "brand_id": 3, "is_active": true, "cost_price": "19000.00", "created_at": "2026-08-11T13:34:37.794Z", "created_by": 1, "updated_at": "2026-08-16T19:52:09.871Z", "category_id": 7, "description": null, "size_variant": "1L", "selling_price": "23000.00", "minimum_threshold": 5, "quantity_in_stock": 114}	\N	2026-08-16 20:52:09.920012
141	1	System Administrator	REDUCE_STOCK	products	15	\N	{"reason": "Wrong entry correction", "quantity": 200, "quantityAfter": 800, "quantityBefore": 1000}	\N	2026-08-16 20:53:57.006413
142	1	System Administrator	ADD_STOCK	products	15	\N	{"quantity": "300", "quantityAfter": 1100, "quantityBefore": 800}	\N	2026-08-16 20:54:12.764739
143	1	System Administrator	UPDATE_PRODUCT	products	15	{"id": 15, "name": "MAX6", "unit": "Litre", "brand_id": 8, "is_active": true, "cost_price": "20000.00", "created_at": "2026-08-16T19:50:34.995Z", "created_by": 1, "updated_at": "2026-08-16T19:54:12.715Z", "category_id": 8, "description": null, "size_variant": "1l", "selling_price": "22000.00", "minimum_threshold": 5, "quantity_in_stock": 1100}	{"id": 15, "name": "MAX6", "unit": "Litre", "brand_id": 8, "is_active": true, "cost_price": "20000.00", "created_at": "2026-08-16T19:50:34.995Z", "created_by": 1, "updated_at": "2026-08-16T19:54:39.029Z", "category_id": 8, "description": null, "size_variant": "1l", "selling_price": "25000.00", "minimum_threshold": 5, "quantity_in_stock": 1100}	\N	2026-08-16 20:54:39.078709
144	1	System Administrator	CREATE_ORDER	orders	19	\N	{"client_id": 4, "itemCount": 2, "orderNumber": "HMS-INV-202608-0016", "totalAmount": 45720000}	\N	2026-08-16 20:59:41.204655
145	1	System Administrator	APPROVE_PAYMENT	orders	20	\N	{"client": "HMS-INV-202608-0017", "order_number": "HMS-INV-202608-0017"}	\N	2026-08-16 21:04:01.701334
146	1	System Administrator	RESOLVE_COMPLAINT	complaints	8	\N	{"subject": "Damaged Goods"}	\N	2026-08-16 21:12:03.169383
147	1	System Administrator	SEND_PRICE_ALERT	price_alerts	\N	\N	{"sent_to": "Garba Karfe", "alert_type": "brand", "brand_name": "BAOSE"}	\N	2026-08-16 21:14:39.124366
148	1	System Administrator	SEND_PRICE_ALERT	price_alerts	\N	\N	{"sent_to": "All Clients", "alert_type": "product", "brand_name": null}	\N	2026-08-16 21:16:36.1236
149	1	System Administrator	LOGIN	users	1	\N	\N	\N	2026-08-19 12:12:48.175262
150	1	System Administrator	LOGIN	users	1	\N	\N	\N	2026-08-19 16:59:31.668149
151	2	Abubakar Musa	LOGIN	users	2	\N	\N	\N	2026-08-19 22:32:32.899823
152	3	Yusuf Ibrahim	LOGIN	users	3	\N	\N	\N	2026-08-19 22:34:48.214226
153	1	System Administrator	STOCK_RECEIPT	stock_receipts	1	\N	{"product_id": "15", "total_received": 100, "accepted_quantity": 95, "defective_quantity": 5}	\N	2026-08-19 22:47:26.045894
154	1	System Administrator	STOCK_RECEIPT	stock_receipt_headers	3	\N	{"results": [{"new_stock": 87, "product_name": "Total Quartz 5W-40", "total_received": 20, "accepted_quantity": 18, "defective_quantity": 2}, {"new_stock": 268, "product_name": "Mobil Super 3000", "total_received": 30, "accepted_quantity": 25, "defective_quantity": 5}], "item_count": 2}	\N	2026-08-19 23:03:24.700121
155	1	System Administrator	LOGIN	users	1	\N	\N	\N	2026-08-20 10:59:37.072577
156	1	System Administrator	LOGIN	users	1	\N	\N	\N	2026-08-21 10:35:03.356943
157	1	System Administrator	STOCK_RECEIPT	stock_receipt_headers	4	\N	{"results": [{"new_stock": 142, "product_name": "Total Quartz 5W-40", "total_received": 60, "accepted_quantity": 55, "defective_quantity": 5}], "item_count": 1}	\N	2026-08-21 11:15:16.823159
158	1	System Administrator	LOGIN	users	1	\N	\N	\N	2026-08-22 15:20:39.910773
159	2	Abubakar Musa	LOGIN	users	2	\N	\N	\N	2026-08-22 15:21:48.344523
160	3	Yusuf Ibrahim	LOGIN	users	3	\N	\N	\N	2026-08-23 19:23:26.202213
161	2	Abubakar Musa	LOGIN	users	2	\N	\N	\N	2026-08-23 19:24:09.488735
162	1	System Administrator	LOGIN	users	1	\N	\N	\N	2026-08-23 19:24:23.805667
163	1	System Administrator	APPROVE_PAYMENT	orders	21	\N	{"client": "HMS-INV-202608-0018", "order_number": "HMS-INV-202608-0018"}	\N	2026-08-23 19:28:50.871576
164	2	Abubakar Musa	ADD_STOCK	products	15	\N	{"quantity": "50", "quantityAfter": 1245, "quantityBefore": 1195}	\N	2026-08-23 19:31:30.587436
165	2	Abubakar Musa	ADD_STOCK	products	4	\N	{"quantity": "10", "quantityAfter": 445, "quantityBefore": 435}	\N	2026-08-23 19:32:30.772344
166	2	Abubakar Musa	ADD_STOCK	products	5	\N	{"quantity": "20", "quantityAfter": 28, "quantityBefore": 8}	\N	2026-08-23 19:32:38.692619
167	2	Abubakar Musa	CONFIRM_ORDER	orders	21	\N	{"status": "confirmed"}	\N	2026-08-23 20:58:39.512098
168	3	Yusuf Ibrahim	RELEASE_GOODS	orders	21	\N	{"status": "released"}	\N	2026-08-23 20:59:33.674131
169	2	Abubakar Musa	APPROVE_WAYBILL	orders	17	\N	{"status": "completed"}	\N	2026-08-23 21:14:02.476689
170	2	Abubakar Musa	APPROVE_WAYBILL	orders	16	\N	{"status": "completed"}	\N	2026-08-23 21:14:36.947336
171	2	Abubakar Musa	CONFIRM_ORDER	orders	20	\N	{"status": "confirmed"}	\N	2026-08-23 21:16:35.583722
172	3	Yusuf Ibrahim	RELEASE_GOODS	orders	20	\N	{"status": "released"}	\N	2026-08-23 21:17:47.406648
173	2	Abubakar Musa	APPROVE_WAYBILL	orders	20	\N	{"status": "completed"}	\N	2026-08-23 21:21:17.819035
174	2	Abubakar Musa	APPROVE_WAYBILL	orders	13	\N	{"status": "completed"}	\N	2026-08-23 21:22:47.927322
175	1	System Administrator	APPROVE_PAYMENT	orders	22	\N	{"client": "HMS-INV-202608-0019", "order_number": "HMS-INV-202608-0019"}	\N	2026-08-23 21:30:41.055153
176	1	System Administrator	CHANGE_PASSWORD	users	1	\N	\N	\N	2026-08-23 21:33:25.193129
177	1	System Administrator	LOGIN	users	1	\N	\N	\N	2026-08-23 21:33:38.28172
178	2	Abubakar Musa	CONFIRM_ORDER	orders	22	\N	{"status": "confirmed"}	\N	2026-08-23 21:37:10.537524
179	3	Yusuf Ibrahim	RELEASE_GOODS	orders	22	\N	{"status": "released"}	\N	2026-08-23 21:38:49.269052
180	2	Abubakar Musa	APPROVE_WAYBILL	orders	22	\N	{"status": "completed"}	\N	2026-08-23 21:39:31.660987
181	1	System Administrator	APPROVE_PAYMENT	orders	23	\N	{"client": "HMS-INV-202608-0020", "order_number": "HMS-INV-202608-0020"}	\N	2026-08-23 21:48:38.535083
182	3	Yusuf Ibrahim	CHANGE_PASSWORD	users	3	\N	\N	\N	2026-08-23 21:53:40.035226
183	3	Yusuf Ibrahim	LOGIN	users	3	\N	\N	\N	2026-08-23 21:53:56.321095
184	1	System Administrator	LOGIN	users	1	\N	\N	\N	2026-08-25 21:24:42.033777
185	3	Yusuf Ibrahim	LOGIN	users	3	\N	\N	\N	2026-08-25 21:31:20.783234
186	2	Abubakar Musa	LOGIN	users	2	\N	\N	\N	2026-08-25 21:32:05.249968
187	2	Abubakar Musa	LOGIN	users	2	\N	\N	\N	2026-08-25 22:23:41.500257
188	2	Abubakar Musa	CHANGE_PASSWORD	users	2	\N	\N	\N	2026-08-25 22:31:40.242367
189	3	Yusuf Ibrahim	RELEASE_GOODS	orders	14	\N	{"status": "released"}	\N	2026-08-25 22:34:13.507553
190	2	Abubakar Musa	REJECT_WAYBILL	waybills	14	\N	{"reason": "wrong bill"}	\N	2026-08-25 22:45:28.919172
191	2	Abubakar Musa	APPROVE_WAYBILL	orders	14	\N	{"status": "completed"}	\N	2026-08-25 22:46:35.380854
192	3	Yusuf Auwal	CHANGE_PASSWORD	users	3	\N	\N	\N	2026-08-25 22:49:03.392469
193	1	Admin	LOGIN	users	1	\N	\N	\N	2026-08-26 11:14:10.39694
194	2	Abubakar Musa	LOGIN	users	2	\N	\N	\N	2026-08-26 11:35:22.953487
195	3	Yusuf Auwal	LOGIN	users	3	\N	\N	\N	2026-08-26 11:38:52.891644
196	4	Fatima Sule	LOGIN	users	4	\N	\N	\N	2026-08-26 13:51:22.299067
197	2	Abubakar Musa	CONFIRM_ORDER	orders	12	\N	{"status": "confirmed"}	\N	2026-08-26 14:07:57.676662
198	3	Yusuf Auwal	RELEASE_GOODS	orders	12	\N	{"status": "released"}	\N	2026-08-26 14:08:42.781626
199	2	Abubakar Musa	APPROVE_WAYBILL	orders	12	\N	{"status": "completed"}	\N	2026-08-26 14:10:38.926424
200	2	Abubakar Musa	APPROVE_WAYBILL	orders	3	\N	{"status": "completed"}	\N	2026-08-26 15:07:57.272362
201	1	Admin	LOGIN	users	1	\N	\N	\N	2026-08-26 18:35:48.251583
202	2	Abubakar Musa	LOGIN	users	2	\N	\N	\N	2026-08-26 18:37:26.450266
203	2	Abubakar Musa	LOGIN	users	2	\N	\N	\N	2026-08-26 18:38:31.288076
204	2	Abubakar Musa	LOGIN	users	2	\N	\N	\N	2026-08-26 19:43:16.940134
205	3	Yusuf Auwal	LOGIN	users	3	\N	\N	\N	2026-08-26 19:47:15.903174
206	1	Admin	LOGIN	users	1	\N	\N	\N	2026-08-27 11:35:12.672708
207	1	Admin	ADD_STOCK	products	5	\N	{"quantity": "40", "quantityAfter": 54, "quantityBefore": 14}	\N	2026-08-27 11:35:40.420865
208	2	Abubakar Musa	LOGIN	users	2	\N	\N	\N	2026-08-27 11:42:33.001377
209	3	Yusuf Auwal	LOGIN	users	3	\N	\N	\N	2026-08-27 11:47:14.441867
210	1	Admin	CREATE_ORDER	orders	24	\N	{"client_id": 3, "itemCount": 1, "orderNumber": "HMS-INV-202608-0021", "totalAmount": 12475000}	\N	2026-08-27 11:48:34.476227
211	2	Abubakar Musa	CONFIRM_ORDER	orders	24	\N	{"status": "confirmed"}	\N	2026-08-27 11:49:17.481134
212	3	Yusuf Auwal	RELEASE_GOODS	orders	24	\N	{"status": "released"}	\N	2026-08-27 12:00:26.473906
213	2	Abubakar Musa	REJECT_WAYBILL	waybills	24	\N	{"reason": "wrong waybill uploaded"}	\N	2026-08-27 12:01:36.38613
214	2	Abubakar Musa	APPROVE_WAYBILL	orders	24	\N	{"status": "completed"}	\N	2026-08-27 12:02:49.080718
215	1	Admin	UPLOAD_RECEIPT	invoices	16	\N	{"order_number": "HMS-INV-202608-0015", "uploaded_on_behalf": true}	\N	2026-08-27 12:07:28.260371
216	1	Admin	APPROVE_PAYMENT	orders	18	\N	{"client": "HMS-INV-202608-0015", "order_number": "HMS-INV-202608-0015"}	\N	2026-08-27 12:07:28.314472
217	2	Abubakar Musa	CONFIRM_ORDER	orders	23	\N	{"status": "confirmed"}	\N	2026-08-27 12:08:34.244351
218	3	Yusuf Auwal	RELEASE_GOODS	orders	23	\N	{"status": "released"}	\N	2026-08-27 12:09:59.593558
219	2	Abubakar Musa	APPROVE_WAYBILL	orders	23	\N	{"status": "completed"}	\N	2026-08-27 12:10:33.773633
220	1	Admin	CREATE_ORDER	orders	25	\N	{"client_id": 1, "itemCount": 2, "orderNumber": "HMS-INV-202608-0022", "totalAmount": 3666000}	\N	2026-08-27 15:48:21.506313
221	2	Abubakar Musa	CONFIRM_ORDER	orders	25	\N	{"status": "confirmed"}	\N	2026-08-27 15:49:08.578117
222	3	Yusuf Auwal	RELEASE_GOODS	orders	25	\N	{"status": "released"}	\N	2026-08-27 15:50:08.950127
223	2	Abubakar Musa	APPROVE_WAYBILL	orders	25	\N	{"status": "completed"}	\N	2026-08-27 15:50:57.946486
224	1	Admin	LOGIN	users	1	\N	\N	\N	2026-08-27 19:12:54.10093
225	1	Admin	CREATE_BRAND	brands	9	\N	{"name": "Conoil"}	\N	2026-08-27 19:14:01.624288
226	1	Admin	LOGIN	users	1	\N	\N	\N	2026-08-27 21:14:01.625336
227	2	Abubakar Musa	LOGIN	users	2	\N	\N	\N	2026-08-27 21:14:15.378614
228	3	Yusuf Auwal	LOGIN	users	3	\N	\N	\N	2026-08-27 21:14:49.303326
229	1	Admin	STOCK_RECEIPT	stock_receipt_headers	5	\N	{"results": [{"new_stock": 235, "product_name": "Total Quartz 5W-40", "total_received": 100, "accepted_quantity": 93, "defective_quantity": 7}], "item_count": 1}	\N	2026-08-27 21:41:13.754702
230	1	Admin	CREATE_ORDER	orders	26	\N	{"client_id": 4, "itemCount": 1, "orderNumber": "HMS-INV-202608-0023", "totalAmount": 9992000}	\N	2026-08-27 21:46:50.095523
231	2	Abubakar Musa	CONFIRM_ORDER	orders	26	\N	{"status": "confirmed"}	\N	2026-08-27 21:47:56.455473
232	3	Yusuf Auwal	RELEASE_GOODS	orders	26	\N	{"status": "released"}	\N	2026-08-27 21:50:05.34691
233	2	Abubakar Musa	REJECT_WAYBILL	waybills	26	\N	{"reason": "wrong waybill"}	\N	2026-08-27 21:51:40.349359
234	2	Abubakar Musa	APPROVE_WAYBILL	orders	26	\N	{"status": "completed"}	\N	2026-08-27 21:52:30.200314
235	1	Admin	CREATE_ORDER	orders	27	\N	{"client_id": 3, "itemCount": 1, "orderNumber": "HMS-INV-202608-0024", "totalAmount": 8999840}	\N	2026-08-27 21:59:21.994127
236	2	Abubakar Musa	CONFIRM_ORDER	orders	27	\N	{"status": "confirmed"}	\N	2026-08-27 22:01:49.309657
237	3	Yusuf Auwal	RELEASE_GOODS	orders	27	\N	{"status": "released"}	\N	2026-08-27 22:02:42.473576
238	2	Abubakar Musa	APPROVE_WAYBILL	orders	27	\N	{"status": "completed"}	\N	2026-08-27 22:13:34.514005
239	1	Admin	APPROVE_PAYMENT	orders	29	\N	{"client": "HMS-INV-202608-0026", "order_number": "HMS-INV-202608-0026"}	\N	2026-08-27 22:17:44.183015
240	2	Abubakar Musa	CONFIRM_ORDER	orders	29	\N	{"status": "confirmed"}	\N	2026-08-27 22:18:53.895338
241	3	Yusuf Auwal	RELEASE_GOODS	orders	29	\N	{"status": "released"}	\N	2026-08-27 22:20:07.640321
242	2	Abubakar Musa	APPROVE_WAYBILL	orders	29	\N	{"status": "completed"}	\N	2026-08-27 22:20:57.180022
243	1	Admin	LOGIN	users	1	\N	\N	\N	2026-08-28 10:29:23.321311
244	2	Abubakar Musa	LOGIN	users	2	\N	\N	\N	2026-08-28 10:59:01.491662
245	1	Admin	LOGIN	users	1	\N	\N	\N	2026-08-28 11:32:53.017714
246	1	Admin	CREATE_ORDER	orders	30	\N	{"client_id": 2, "itemCount": 1, "orderNumber": "HMS-INV-202608-0027", "totalAmount": 500000}	\N	2026-08-28 11:53:47.899097
247	1	Admin	UPLOAD_RECEIPT	invoices	28	\N	{"order_number": "HMS-INV-202608-0027", "uploaded_on_behalf": true}	\N	2026-08-28 11:54:02.142383
248	1	Admin	APPROVE_PAYMENT	orders	30	\N	{"client": "HMS-INV-202608-0027", "order_number": "HMS-INV-202608-0027"}	\N	2026-08-28 11:54:02.190276
249	2	Abubakar Musa	CONFIRM_ORDER	orders	30	\N	{"status": "confirmed"}	\N	2026-08-28 11:57:19.025461
250	3	Yusuf Auwal	LOGIN	users	3	\N	\N	\N	2026-08-28 12:27:27.231947
251	3	Yusuf Auwal	RELEASE_GOODS	orders	30	\N	{"status": "released"}	\N	2026-08-28 12:27:59.496092
252	2	Abubakar Musa	APPROVE_WAYBILL	orders	30	\N	{"status": "completed"}	\N	2026-08-28 12:29:01.357805
253	1	Admin	UPLOAD_RECEIPT	invoices	26	\N	{"order_number": "HMS-INV-202608-0025", "uploaded_on_behalf": true}	\N	2026-08-28 14:50:30.126984
254	1	Admin	APPROVE_PAYMENT	orders	28	\N	{"client": "HMS-INV-202608-0025", "order_number": "HMS-INV-202608-0025"}	\N	2026-08-28 14:50:30.141532
255	1	Admin	CREATE_ORDER	orders	31	\N	{"client_id": 3, "itemCount": 1, "orderNumber": "HMS-INV-202608-0028", "totalAmount": 202500}	\N	2026-08-28 14:52:12.629451
256	1	Admin	CREATE_ORDER	orders	32	\N	{"client_id": 3, "itemCount": 1, "orderNumber": "HMS-INV-202608-0029", "totalAmount": 520000}	\N	2026-08-28 15:05:14.518038
257	2	Abubakar Musa	CONFIRM_ORDER	orders	32	\N	{"status": "confirmed"}	\N	2026-08-28 15:09:20.425475
258	1	Admin	CREATE_CLIENT	clients	6	\N	{"status": "prospect", "clientId": null, "full_name": "AYM shafa"}	\N	2026-08-28 17:07:59.209723
259	1	Admin	CREATE_ORDER	orders	33	\N	{"client_id": 6, "itemCount": 1, "orderNumber": "HMS-INV-202608-0030", "totalAmount": 275000}	\N	2026-08-28 17:09:02.414392
260	1	Admin	CREATE_ORDER	orders	34	\N	{"client_id": 6, "itemCount": 1, "orderNumber": "HMS-INV-202608-0031", "totalAmount": 1040000}	\N	2026-08-28 17:13:31.213122
261	1	Admin	CONFIRM_PROSPECT	clients	6	\N	{"client_id": "HMS-CLT-0005", "full_name": "AYM shafa"}	\N	2026-08-28 17:15:14.686418
262	1	Admin	LOGIN	users	1	\N	\N	\N	2026-08-29 20:26:07.137467
263	1	Admin	ADD_STOCK	products	15	\N	{"quantity": "400", "quantityAfter": 507, "quantityBefore": 107}	\N	2026-08-29 20:26:39.767699
264	1	Admin	ADD_STOCK	products	4	\N	{"quantity": "200", "quantityAfter": 622, "quantityBefore": 422}	\N	2026-08-29 20:26:48.612785
265	2	Abubakar Musa	LOGIN	users	2	\N	\N	\N	2026-08-29 20:29:32.626451
266	3	Yusuf Auwal	LOGIN	users	3	\N	\N	\N	2026-08-29 20:30:21.503599
267	2	Abubakar Musa	LOGIN	users	2	\N	\N	\N	2026-08-29 20:35:18.502153
268	2	Abubakar Musa	CONFIRM_ORDER	orders	34	\N	{"status": "confirmed"}	\N	2026-08-29 20:35:56.759876
269	3	Yusuf Auwal	RELEASE_GOODS	orders	34	\N	{"status": "released"}	\N	2026-08-29 20:49:49.266748
270	2	Abubakar Musa	APPROVE_WAYBILL	orders	34	\N	{"status": "completed"}	\N	2026-08-29 20:57:42.880226
271	1	Admin	LOGIN	users	1	\N	\N	\N	2026-08-30 09:07:00.959881
272	1	Admin	CREATE_CLIENT	clients	7	\N	{"status": "prospect", "clientId": null, "full_name": "Haladawa Synergy"}	\N	2026-08-30 09:22:32.67749
273	1	Admin	CREATE_ORDER	orders	35	\N	{"client_id": 7, "itemCount": 2, "orderNumber": "HMS-INV-202608-0032", "totalAmount": 10292000}	\N	2026-08-30 09:23:36.071898
274	1	Admin	APPROVE_PAYMENT	orders	36	\N	{"client": "HMS-INV-202608-0033", "order_number": "HMS-INV-202608-0033"}	\N	2026-08-30 09:27:35.640375
275	2	Abubakar Musa	LOGIN	users	2	\N	\N	\N	2026-08-30 09:27:44.959517
276	2	Abubakar Musa	CONFIRM_ORDER	orders	36	\N	{"status": "confirmed"}	\N	2026-08-30 09:29:04.46936
277	3	Yusuf Auwal	LOGIN	users	3	\N	\N	\N	2026-08-30 09:30:24.45743
278	3	Yusuf Auwal	RELEASE_GOODS	orders	36	\N	{"status": "released"}	\N	2026-08-30 09:31:06.624773
279	2	Abubakar Musa	REJECT_WAYBILL	waybills	36	\N	{"reason": "wrong documents"}	\N	2026-08-30 09:32:31.112054
280	2	Abubakar Musa	APPROVE_WAYBILL	orders	36	\N	{"status": "completed"}	\N	2026-08-30 09:33:53.898572
281	1	Admin	ADD_STOCK	products	5	\N	{"unit": "Drum", "quantity": "200", "productName": "Hydraulic Dot 3", "quantityAfter": 240, "quantityBefore": 40}	\N	2026-08-30 09:45:51.507508
282	1	Admin	ADD_STOCK	products	4	\N	{"unit": "Carton", "quantity": "50", "productName": "Mobil ", "quantityAfter": 648, "quantityBefore": 598}	\N	2026-08-30 09:46:19.418304
283	1	Admin	CONFIRM_PROSPECT	clients	7	\N	{"client_id": "HMS-CLT-0006", "full_name": "Haladawa Synergy"}	\N	2026-08-30 09:51:01.372309
284	1	Admin	RESOLVE_COMPLAINT	complaints	9	\N	{"subject": "service downtime"}	\N	2026-08-30 09:55:52.611385
285	1	Admin	RESOLVE_COMPLAINT	complaints	10	\N	{"subject": "failure"}	\N	2026-08-30 10:03:26.800502
\.


--
-- Data for Name: brands; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.brands (id, name, description, is_active, created_by, created_at) FROM stdin;
1	Total Energies	TotalEnergies lubricant products	t	1	2026-08-04 12:18:50.193152
2	Shell	Shell lubricant products	t	1	2026-08-04 12:18:50.193152
3	Mobil	Mobil lubricant products	t	1	2026-08-04 12:18:50.193152
4	Castrol	Castrol lubricant products	t	1	2026-08-04 12:18:50.193152
6	Oando	engine oil	t	1	2026-08-08 19:56:21.617967
5	Ammasco	Ammasco Lubricants	t	1	2026-08-07 11:50:20.149631
8	BAOSE	\N	t	1	2026-08-16 20:49:42.937649
9	Conoil	\N	t	1	2026-08-27 19:14:01.616484
\.


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.categories (id, name, description, is_active, created_by, created_at) FROM stdin;
2	Grease	Grease and lubricating compounds	t	1	2026-08-04 12:18:50.195601
3	Other Supplies	Other lubricant and related supplies	t	1	2026-08-04 12:18:50.195601
4	Oil Cleanser	Car oil cleaning material	t	1	2026-08-07 11:49:59.312936
6	Hydraulic	\N	t	1	2026-08-08 20:16:50.091057
7	Lubricants	\N	t	1	2026-08-11 14:27:38.155294
1	Engine Oil	Engine and motor oil products	t	1	2026-08-04 12:18:50.195601
8	Lubricant	\N	t	1	2026-08-16 20:49:52.856194
\.


--
-- Data for Name: clients; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.clients (id, client_id, full_name, email, phone, address, credit_terms, is_active, added_by, created_at, updated_at, password_hash, status, confirmed_at, confirmed_by) FROM stdin;
2	HMS-CLT-0002	IMG	imginvestment@gmail.com	08035078465	Naibawa	0	t	1	2026-08-08 20:00:29.021584	2026-08-08 20:00:29.021584	\N	active	\N	\N
1	HMS-CLT-0001	Al-Amin Enterprises	alamin@gmail.com	08012345678	Kano, Nigeria	0	t	1	2026-08-05 15:16:14.315542	2026-08-05 15:16:14.315542	$2b$10$yUNXmCLUMXDJqVLy4Jngw.vdzdrqe8ZGrkXRUrcA6eui57JaiQB1u	active	\N	\N
4	HMS-CLT-0004	Garba Karfe	Gkarfe@hotmaail.com	09877665544	Kano Zaria Road	0	t	1	2026-08-14 22:28:06.635514	2026-08-23 20:54:40.907407	$2b$10$bxcJ09utdAkYhSwIe7F8.eTOXFAjE7lUTSt3cuuzbHcyLXBObxa5S	active	\N	\N
6	HMS-CLT-0005	AYM shafa	AYM@HOTMAIL.COM	091234567890	Kano Opp Zaria hotel	0	t	1	2026-08-28 17:07:59.132609	2026-08-28 17:15:14.649946	\N	active	2026-08-28 17:15:14.649946	1
3	HMS-CLT-0003	Aspira	aspira@gmail.com	09876543214	Hadejia Road	0	t	1	2026-08-08 20:20:13.016757	2026-08-08 20:20:13.016757	$2b$10$h0eWOYRw.dHtfuIFaJkES.ITdxpnaxTcJUSZAieB9w.Spf/WRof0O	active	\N	\N
7	HMS-CLT-0006	Haladawa Synergy	Hladawas@hotmail.com	09879009988	Yna hamar eastern bypass	0	t	1	2026-08-30 09:22:32.656871	2026-08-30 09:51:01.323625	\N	active	2026-08-30 09:51:01.323625	1
\.


--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.orders (id, order_number, client_id, status, total_amount, notes, created_by, confirmed_by, released_by, completed_by, created_at, confirmed_at, released_at, completed_at, updated_at, subtotal, discount_amount, discount_type, total_discount, payment_method, created_by_admin) FROM stdin;
1	HMS-ORD-202608-0001	1	created	75000.00	First test order	1	\N	\N	\N	2026-08-05 20:51:39.247182	\N	\N	\N	2026-08-05 20:51:39.247182	75000.00	0.00	fixed	0.00	bank_transfer	f
2	HMS-ORD-202608-0002	1	completed	375000.00	Pending balance from previous order for 30,000	1	2	3	2	2026-08-05 21:29:12.480757	2026-08-06 10:21:21.642436	2026-08-06 11:26:02.989901	2026-08-06 11:28:10.893814	2026-08-06 11:28:10.893814	375000.00	0.00	fixed	0.00	bank_transfer	f
4	HMS-ORD-202608-0004	3	released	46039200.00	\N	1	2	3	\N	2026-08-08 20:21:31.938943	2026-08-08 20:23:59.582321	2026-08-08 20:25:55.538837	\N	2026-08-08 20:25:55.538837	46039200.00	0.00	fixed	0.00	bank_transfer	f
8	HMS-INV-202608-0005	1	created	14679260.00	\N	1	\N	\N	\N	2026-08-12 13:44:12.617893	\N	\N	\N	2026-08-12 13:44:12.617893	14709760.00	0.00	fixed	30500.00	bank_transfer	f
9	HMS-INV-202608-0006	1	created	10979840.00	\N	\N	\N	\N	\N	2026-08-12 14:50:15.267213	\N	\N	\N	2026-08-12 14:50:15.267213	10979840.00	0.00	fixed	0.00	bank_transfer	f
10	HMS-INV-202608-0007	1	created	994000.00	\N	\N	\N	\N	\N	2026-08-12 15:21:37.038763	\N	\N	\N	2026-08-12 15:21:37.038763	994000.00	0.00	fixed	0.00	bank_transfer	f
11	HMS-INV-202608-0008	1	created	3219952.00	\N	\N	\N	\N	\N	2026-08-12 15:38:54.335836	\N	\N	\N	2026-08-12 15:38:54.335836	3219952.00	0.00	fixed	0.00	bank_transfer	f
15	HMS-INV-202608-0012	2	confirmed	3403500.00	\N	1	2	\N	\N	2026-08-12 22:44:00.553309	2026-08-14 15:19:28.375153	\N	\N	2026-08-14 15:19:28.375153	3430000.00	0.00	fixed	26500.00	bank_transfer	f
18	HMS-INV-202608-0015	4	created	260000.00	\N	\N	\N	\N	\N	2026-08-14 22:45:25.871314	\N	\N	\N	2026-08-14 22:45:25.871314	260000.00	0.00	fixed	0.00	bank_transfer	f
19	HMS-INV-202608-0016	4	created	45720000.00	\N	1	\N	\N	\N	2026-08-16 20:59:41.204655	\N	\N	\N	2026-08-16 20:59:41.204655	45800000.00	0.00	fixed	80000.00	cash	t
21	HMS-INV-202608-0018	4	completed	125000.00	\N	\N	2	3	\N	2026-08-23 19:27:57.415583	2026-08-23 20:58:39.451166	2026-08-23 20:59:33.674131	\N	2026-08-23 21:10:12.348552	125000.00	0.00	fixed	0.00	bank_transfer	f
17	HMS-INV-202608-0014	4	completed	10259840.00	\N	\N	2	3	\N	2026-08-14 22:31:23.60258	2026-08-14 22:42:48.280532	2026-08-14 22:43:24.751889	\N	2026-08-23 21:14:02.423312	10259840.00	0.00	fixed	0.00	bank_transfer	f
16	HMS-INV-202608-0013	3	completed	1159500.00	\N	1	2	3	\N	2026-08-12 23:49:40.520705	2026-08-14 15:14:01.576071	2026-08-14 16:29:05.178978	\N	2026-08-23 21:14:36.895695	1160000.00	0.00	fixed	500.00	cash	t
20	HMS-INV-202608-0017	1	completed	10219872.00	\N	\N	2	3	\N	2026-08-16 21:01:46.3715	2026-08-23 21:16:35.57273	2026-08-23 21:17:47.406648	\N	2026-08-23 21:21:17.793639	10219872.00	0.00	fixed	0.00	bank_transfer	f
13	HMS-INV-202608-0010	1	completed	1835968.00	\N	\N	2	3	\N	2026-08-12 17:45:38.905463	2026-08-14 15:29:07.256762	2026-08-14 16:55:53.232085	\N	2026-08-23 21:22:47.919263	1835968.00	0.00	fixed	0.00	bank_transfer	f
22	HMS-INV-202608-0019	4	completed	3705936.00	\N	\N	2	3	\N	2026-08-23 21:28:43.686272	2026-08-23 21:37:10.485691	2026-08-23 21:38:49.269052	\N	2026-08-23 21:39:31.653015	3705936.00	0.00	fixed	0.00	bank_transfer	f
14	HMS-INV-202608-0011	1	completed	520000.00	\N	\N	2	3	\N	2026-08-12 17:52:37.340613	2026-08-14 15:28:11.081032	2026-08-25 22:34:13.507553	\N	2026-08-25 22:46:35.329285	520000.00	0.00	fixed	0.00	bank_transfer	f
12	HMS-INV-202608-0009	1	completed	1903968.00	\N	\N	2	3	\N	2026-08-12 17:23:36.477554	2026-08-26 14:07:57.656999	2026-08-26 14:08:42.781626	\N	2026-08-26 14:10:38.918943	1903968.00	0.00	fixed	0.00	bank_transfer	f
3	HMS-ORD-202608-0003	2	completed	2615000.00	\N	1	2	3	\N	2026-08-08 20:01:17.695875	2026-08-08 20:03:05.354032	2026-08-08 20:07:11.509869	\N	2026-08-26 15:07:57.258657	2615000.00	0.00	fixed	0.00	bank_transfer	f
24	HMS-INV-202608-0021	3	completed	12475000.00	\N	1	2	3	\N	2026-08-27 11:48:34.476227	2026-08-27 11:49:17.425562	2026-08-27 12:00:26.473906	\N	2026-08-27 12:02:49.030639	12500000.00	0.00	fixed	25000.00	cash	t
23	HMS-INV-202608-0020	4	completed	75000.00	\N	\N	2	3	\N	2026-08-23 21:47:15.149017	2026-08-27 12:08:34.183059	2026-08-27 12:09:59.593558	\N	2026-08-27 12:10:33.765444	75000.00	0.00	fixed	0.00	bank_transfer	f
25	HMS-INV-202608-0022	1	completed	3666000.00	\N	1	2	3	\N	2026-08-27 15:48:21.506313	2026-08-27 15:49:08.566964	2026-08-27 15:50:08.950127	\N	2026-08-27 15:50:57.937139	3666000.00	0.00	fixed	0.00	cash	t
26	HMS-INV-202608-0023	4	completed	9992000.00	\N	1	2	3	\N	2026-08-27 21:46:50.095523	2026-08-27 21:47:56.396071	2026-08-27 21:50:05.34691	\N	2026-08-27 21:52:30.150407	10000000.00	0.00	fixed	8000.00	pos	t
28	HMS-INV-202608-0025	1	created	364000.00	\N	\N	\N	\N	\N	2026-08-27 22:00:27.10582	\N	\N	\N	2026-08-27 22:00:27.10582	364000.00	0.00	fixed	0.00	bank_transfer	f
27	HMS-INV-202608-0024	3	completed	8999840.00	\N	1	2	3	\N	2026-08-27 21:59:21.994127	2026-08-27 22:01:49.252796	2026-08-27 22:02:42.473576	\N	2026-08-27 22:13:34.465136	8999840.00	0.00	fixed	0.00	cash	t
29	HMS-INV-202608-0026	1	completed	1142000.00	\N	\N	2	3	\N	2026-08-27 22:15:44.832271	2026-08-27 22:18:53.887941	2026-08-27 22:20:07.640321	\N	2026-08-27 22:20:57.129399	1142000.00	0.00	fixed	0.00	bank_transfer	f
30	HMS-INV-202608-0027	2	completed	500000.00	\N	1	2	3	\N	2026-08-28 11:53:47.899097	2026-08-28 11:57:19.008879	2026-08-28 12:27:59.496092	\N	2026-08-28 12:29:01.347303	500000.00	0.00	fixed	0.00	bank_transfer	t
31	HMS-INV-202608-0028	3	created	202500.00	\N	1	\N	\N	\N	2026-08-28 14:52:12.629451	\N	\N	\N	2026-08-28 14:52:12.629451	202500.00	0.00	fixed	0.00	cash	t
32	HMS-INV-202608-0029	3	confirmed	520000.00	\N	1	2	\N	\N	2026-08-28 15:05:14.518038	2026-08-28 15:09:20.407229	\N	\N	2026-08-28 15:09:20.407229	520000.00	0.00	fixed	0.00	pos	t
33	HMS-INV-202608-0030	6	created	275000.00	\N	1	\N	\N	\N	2026-08-28 17:09:02.414392	\N	\N	\N	2026-08-28 17:09:02.414392	275000.00	0.00	fixed	0.00	pos	t
34	HMS-INV-202608-0031	6	completed	1040000.00	\N	1	2	3	\N	2026-08-28 17:13:31.213122	2026-08-29 20:35:56.747474	2026-08-29 20:49:49.266748	\N	2026-08-29 20:57:42.828618	1040000.00	0.00	fixed	0.00	pos	t
35	HMS-INV-202608-0032	7	created	10292000.00	\N	1	\N	\N	\N	2026-08-30 09:23:36.071898	\N	\N	\N	2026-08-30 09:23:36.071898	10300000.00	0.00	fixed	8000.00	pos	t
36	HMS-INV-202608-0033	3	completed	4040436.00	\N	\N	2	3	\N	2026-08-30 09:24:59.302457	2026-08-30 09:29:04.413881	2026-08-30 09:31:06.624773	\N	2026-08-30 09:33:53.846658	4040436.00	0.00	fixed	0.00	bank_transfer	f
\.


--
-- Data for Name: complaints; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.complaints (id, client_id, order_id, subject, message, status, admin_response, responded_by, responded_at, created_at, updated_at) FROM stdin;
1	1	9	Order Not yet delivered	I have paid for the order but it is not yet delivered still waiting	resolved	Please be a little patient. they are on their way	1	2026-08-12 14:54:05.498658	2026-08-12 14:53:24.240275	2026-08-12 14:54:05.498658
3	1	10	still awaiting my order	admin how far	resolved	at you door step	1	2026-08-12 15:32:39.198877	2026-08-12 15:32:09.580649	2026-08-12 15:32:39.198877
4	1	\N	Your deliveries 	Your deliveries are slow, please improve on that	resolved	Okay thanks for the headsup	1	2026-08-12 15:48:46.580906	2026-08-12 15:48:13.308512	2026-08-12 15:48:46.580906
2	1	10	Part payment	Why is my order showing part payment when i payed in full?	resolved	This issue has been resolved now	1	2026-08-12 17:12:14.502172	2026-08-12 15:23:24.192409	2026-08-12 17:12:14.502172
5	1	\N	Please do give me discount sometimes	Discount needed	resolved	you welcome	1	2026-08-12 17:16:29.729292	2026-08-12 17:15:19.027641	2026-08-12 17:16:29.729292
6	1	\N	Item Expiry	Some of your items are expired	resolved	sorry i will change them	\N	\N	2026-08-12 23:32:23.937327	2026-08-12 23:32:52.879787
7	4	17	My order yet to arrive	Hello am still waiting for my order	resolved	u wlcm	\N	\N	2026-08-14 22:46:15.629046	2026-08-14 22:47:53.94693
8	1	20	Damaged Goods	Baose 1l was damaged	resolved	Fix is on the way	\N	\N	2026-08-16 21:10:56.529616	2026-08-16 21:12:03.154878
9	3	\N	service downtime	you need to improve your services please!!	resolved	pleasure	\N	\N	2026-08-30 09:52:42.28544	2026-08-30 09:55:52.599341
10	3	\N	failure	still awaiting my order	resolved	u wlcm	\N	\N	2026-08-30 10:02:16.219985	2026-08-30 10:03:26.79367
\.


--
-- Data for Name: client_notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.client_notifications (id, client_id, type, title, message, is_read, order_id, created_at, complaint_id) FROM stdin;
1	1	payment_approved	Payment Approved	Your payment for order HMS-INV-202608-0006 has been approved.	t	9	2026-08-12 14:51:13.967115	\N
2	1	complaint_response	Complaint Response	Your complaint "Order Not yet delivered" has been responded to.	t	9	2026-08-12 14:54:05.549953	\N
3	1	payment_approved	Payment Approved	Your payment for order HMS-INV-202608-0007 has been approved.	t	10	2026-08-12 15:23:37.918066	\N
4	1	complaint_response	Complaint Response	Your complaint "Part payment" has been responded to.	t	10	2026-08-12 15:24:01.85387	\N
5	1	complaint_response	Complaint Response	Your complaint "still awaiting my order" has been responded to.	t	10	2026-08-12 15:32:39.249839	\N
6	1	payment_approved	Payment Approved	Your payment for order HMS-INV-202608-0008 has been approved.	t	11	2026-08-12 15:40:45.914287	\N
7	1	complaint_response	Complaint Response	Your complaint "Your deliveries " has been responded to.	t	\N	2026-08-12 15:48:46.589838	\N
8	1	complaint_response	Complaint Response	Admin has responded to your complaint: "Part payment"	t	10	2026-08-12 17:12:14.504656	2
9	1	complaint_response	Complaint Response	Admin has responded to your complaint: "Please do give me discount sometimes"	t	\N	2026-08-12 17:15:48.062807	5
10	1	complaint_response	Complaint Response	Admin has responded to your complaint: "Please do give me discount sometimes"	t	\N	2026-08-12 17:16:29.731703	5
11	1	payment_approved	Payment Approved	Your payment for order HMS-INV-202608-0009 has been approved.	t	12	2026-08-12 17:30:57.708315	\N
12	1	payment_approved	Payment Approved	Your payment for order HMS-INV-202608-0005 has been approved.	t	8	2026-08-12 17:31:07.557568	\N
13	1	payment_approved	Payment Approved	Your payment for order HMS-INV-202608-0010 has been approved.	t	13	2026-08-12 17:46:36.94859	\N
14	1	payment_approved	Payment Approved	Your payment for order HMS-ORD-202608-0001 has been approved.	t	1	2026-08-12 17:46:45.645812	\N
15	2	price_update	Price Update: Hydraulic Dot 3	The price of Hydraulic Dot 3 has been updated from NGN 12,000.00 to NGN 15,000.00.	f	\N	2026-08-12 18:15:00.21913	\N
17	1	price_update	Price Update: Hydraulic Dot 3	The price of Hydraulic Dot 3 has been updated from NGN 12,000.00 to NGN 15,000.00.	t	\N	2026-08-12 18:15:00.21913	\N
18	2	price_update	Price Update: Total 40l	The price of Total 40l has been updated from NGN 10,000.00 to NGN 12,500.00.	f	\N	2026-08-12 22:19:49.01511	\N
20	1	price_update	Price Update: Total 40l	The price of Total 40l has been updated from NGN 10,000.00 to NGN 12,500.00.	t	\N	2026-08-12 22:19:49.01511	\N
21	2	price_update	Price Update: Mobil 1 esp	The price of Mobil 1 esp has been updated from NGN 10,000.00 to NGN 110,000.00.	f	\N	2026-08-12 22:28:43.442546	\N
24	2	price_update	Price Update: The products will be changing in the coming days. Please contact us for more information. Products	Price Update Notice: The price of all The products will be changing in the coming days. Please contact us for more information. products will be changing in the coming days. Please contact us for more information.	f	\N	2026-08-12 22:40:53.876081	\N
23	1	price_update	Price Update: Mobil 1 esp	The price of Mobil 1 esp has been updated from NGN 10,000.00 to NGN 110,000.00.	t	\N	2026-08-12 22:28:43.442546	\N
26	1	price_update	Price Update: The products will be changing in the coming days. Please contact us for more information. Products	Price Update Notice: The price of all The products will be changing in the coming days. Please contact us for more information. products will be changing in the coming days. Please contact us for more information.	t	\N	2026-08-12 22:40:53.876081	\N
27	2	price_update	Product Price Update Notice	Price Update Notice:\n\n• Hydraulic Dot 3: Price Increase ↑\n• Mobil 1 ESP: Price Decrease ↓\n• Total Quartz 5W-40: Price Increase ↑\n\nPlease contact us for more details.	f	\N	2026-08-12 22:58:10.752326	\N
29	1	price_update	Product Price Update Notice	Price Update Notice:\n\n• Hydraulic Dot 3: Price Increase ↑\n• Mobil 1 ESP: Price Decrease ↓\n• Total Quartz 5W-40: Price Increase ↑\n\nPlease contact us for more details.	t	\N	2026-08-12 22:58:10.752326	\N
30	2	price_update	Price Update: Castrol Products	Price Update Notice: The price of all Castrol products will be changing in the coming days. Please contact us for more information.	f	\N	2026-08-12 23:02:36.570728	\N
33	2	price_update	Price Update: Oando Products	Price Update Notice: The price of all Oando products will be changing in the coming days. Please contact us for more information.	f	\N	2026-08-12 23:31:46.233194	\N
37	2	payment_approved	Payment Approved	Your payment for order HMS-INV-202608-0012 has been approved. Your invoice is now marked as PAID.	f	15	2026-08-12 23:51:06.794484	\N
16	3	price_update	Price Update: Hydraulic Dot 3	The price of Hydraulic Dot 3 has been updated from NGN 12,000.00 to NGN 15,000.00.	t	\N	2026-08-12 18:15:00.21913	\N
19	3	price_update	Price Update: Total 40l	The price of Total 40l has been updated from NGN 10,000.00 to NGN 12,500.00.	t	\N	2026-08-12 22:19:49.01511	\N
22	3	price_update	Price Update: Mobil 1 esp	The price of Mobil 1 esp has been updated from NGN 10,000.00 to NGN 110,000.00.	t	\N	2026-08-12 22:28:43.442546	\N
25	3	price_update	Price Update: The products will be changing in the coming days. Please contact us for more information. Products	Price Update Notice: The price of all The products will be changing in the coming days. Please contact us for more information. products will be changing in the coming days. Please contact us for more information.	t	\N	2026-08-12 22:40:53.876081	\N
40	4	payment_approved	Payment Approved	Your payment for order HMS-INV-202608-0014 has been approved. Your invoice is now marked as PAID.	t	17	2026-08-14 22:35:07.818149	\N
41	4	complaint_response	Admin has responded to your complaint	Admin has responded to your complaint: "My order yet to arrive"	t	17	2026-08-14 22:46:53.158741	7
43	2	price_update	Price Update: Castrol Products	Price Update Notice: The price of all Castrol products will be changing in the coming days. Please contact us for more information.	f	\N	2026-08-14 22:48:43.478319	\N
42	4	complaint_response	Admin has responded to your complaint	Admin has responded to your complaint: "My order yet to arrive"	t	17	2026-08-14 22:47:53.949987	7
46	4	price_update	Price Update: Castrol Products	Price Update Notice: The price of all Castrol products will be changing in the coming days. Please contact us for more information.	t	\N	2026-08-14 22:48:43.478319	\N
47	4	price_update	Product Price Update Notice	Price Update Notice:\n\n• Mobil Motor40: Price Increase ↑\n• Mobil Super 2000: Price Increase ↑\n• Total Quartz 5W-40: Price Increase ↑\n• Mobil ENG: Price Increase ↑\n\nPlease contact us for more details.	t	\N	2026-08-14 22:50:20.237578	\N
32	1	price_update	Price Update: Castrol Products	Price Update Notice: The price of all Castrol products will be changing in the coming days. Please contact us for more information.	t	\N	2026-08-12 23:02:36.570728	\N
35	1	price_update	Price Update: Oando Products	Price Update Notice: The price of all Oando products will be changing in the coming days. Please contact us for more information.	t	\N	2026-08-12 23:31:46.233194	\N
36	1	complaint_response	Admin has responded to your complaint	Admin has responded to your complaint: "Item Expiry"	t	\N	2026-08-12 23:32:52.881568	6
38	1	payment_approved	Payment Approved	Your payment for order HMS-ORD-202608-0002 has been approved. Your invoice is now marked as PAID.	t	2	2026-08-12 23:52:49.890282	\N
39	1	payment_approved	Payment Approved	Your payment for order HMS-INV-202608-0011 has been approved. Your invoice is now marked as PAID.	t	14	2026-08-14 14:52:01.880057	\N
45	1	price_update	Price Update: Castrol Products	Price Update Notice: The price of all Castrol products will be changing in the coming days. Please contact us for more information.	t	\N	2026-08-14 22:48:43.478319	\N
48	1	payment_approved	Payment Approved	Your payment for order HMS-INV-202608-0017 has been approved. Your invoice is now marked as PAID.	t	20	2026-08-16 21:04:01.696269	\N
49	1	complaint_response	Admin has responded to your complaint	Admin has responded to your complaint: "Damaged Goods"	t	20	2026-08-16 21:12:03.15767	8
50	4	price_update	Price Update: BAOSE Products	Price Update Notice: The price of all BAOSE products will be changing in the coming days. Please contact us for more information.	t	\N	2026-08-16 21:14:39.106564	\N
51	2	price_update	Product Price Update Notice	Price Update Notice:\n\n• MAX6: Price Increase ↑\n• Total Quartz 5W-40: Price Increase ↑\n• Mobil Super 3000: Price Decrease ↓\n\nPlease contact us for more details.	f	\N	2026-08-16 21:16:36.064331	\N
54	4	price_update	Product Price Update Notice	Price Update Notice:\n\n• MAX6: Price Increase ↑\n• Total Quartz 5W-40: Price Increase ↑\n• Mobil Super 3000: Price Decrease ↓\n\nPlease contact us for more details.	t	\N	2026-08-16 21:16:36.064331	\N
55	4	payment_approved	Payment Approved	Your payment for order HMS-INV-202608-0018 has been approved. Your invoice is now marked as PAID.	t	21	2026-08-23 19:28:50.847617	\N
56	4	payment_approved	Payment Approved	Your payment for order HMS-INV-202608-0019 has been approved. Your invoice is now marked as PAID.	t	22	2026-08-23 21:30:41.023051	\N
57	4	payment_approved	Payment Approved	Your payment for order HMS-INV-202608-0020 has been approved. Your invoice is now marked as PAID.	f	23	2026-08-23 21:48:38.52876	\N
58	4	payment_approved	Payment Approved	Your payment for order HMS-INV-202608-0015 has been approved. Your invoice is now marked as PAID.	f	18	2026-08-27 12:07:28.287975	\N
53	1	price_update	Product Price Update Notice	Price Update Notice:\n\n• MAX6: Price Increase ↑\n• Total Quartz 5W-40: Price Increase ↑\n• Mobil Super 3000: Price Decrease ↓\n\nPlease contact us for more details.	t	\N	2026-08-16 21:16:36.064331	\N
59	1	payment_approved	Payment Approved	Your payment for order HMS-INV-202608-0026 has been approved. Your invoice is now marked as PAID.	t	29	2026-08-27 22:17:44.129922	\N
60	2	payment_approved	Payment Approved	Your payment for order HMS-INV-202608-0027 has been approved. Your invoice is now marked as PAID.	f	30	2026-08-28 11:54:02.162824	\N
61	1	payment_approved	Payment Approved	Your payment for order HMS-INV-202608-0025 has been approved. Your invoice is now marked as PAID.	f	28	2026-08-28 14:50:30.138019	\N
28	3	price_update	Product Price Update Notice	Price Update Notice:\n\n• Hydraulic Dot 3: Price Increase ↑\n• Mobil 1 ESP: Price Decrease ↓\n• Total Quartz 5W-40: Price Increase ↑\n\nPlease contact us for more details.	t	\N	2026-08-12 22:58:10.752326	\N
31	3	price_update	Price Update: Castrol Products	Price Update Notice: The price of all Castrol products will be changing in the coming days. Please contact us for more information.	t	\N	2026-08-12 23:02:36.570728	\N
34	3	price_update	Price Update: Oando Products	Price Update Notice: The price of all Oando products will be changing in the coming days. Please contact us for more information.	t	\N	2026-08-12 23:31:46.233194	\N
44	3	price_update	Price Update: Castrol Products	Price Update Notice: The price of all Castrol products will be changing in the coming days. Please contact us for more information.	t	\N	2026-08-14 22:48:43.478319	\N
52	3	price_update	Product Price Update Notice	Price Update Notice:\n\n• MAX6: Price Increase ↑\n• Total Quartz 5W-40: Price Increase ↑\n• Mobil Super 3000: Price Decrease ↓\n\nPlease contact us for more details.	t	\N	2026-08-16 21:16:36.064331	\N
62	3	payment_approved	Payment Approved	Your payment for order HMS-INV-202608-0033 has been approved. Your invoice is now marked as PAID.	t	36	2026-08-30 09:27:35.635249	\N
63	3	complaint_response	Admin has responded to your complaint	Admin has responded to your complaint: "service downtime"	t	\N	2026-08-30 09:53:44.946796	9
64	3	complaint_response	Admin has responded to your complaint	Admin has responded to your complaint: "service downtime"	t	\N	2026-08-30 09:55:52.601424	9
65	3	complaint_response	Admin has responded to your complaint	Admin has responded to your complaint: "failure"	f	\N	2026-08-30 10:02:40.697947	10
66	3	complaint_response	Admin has responded to your complaint	Admin has responded to your complaint: "failure"	f	\N	2026-08-30 10:03:26.795935	10
\.


--
-- Data for Name: company_settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.company_settings (id, setting_key, setting_value, updated_by, updated_at) FROM stdin;
1	bank_account_name	HAMSAAD Industries Ltd	1	2026-08-27 11:37:53.859457
2	bank_account_number	0000000000	1	2026-08-27 11:37:53.915019
3	bank_name	First Bank of Nigeria	1	2026-08-27 11:37:53.91713
7	company_name	Hamsaad Lubricant Nig Ltd	1	2026-08-27 11:37:53.91937
8	company_address	Naibawa off zaria Road	1	2026-08-27 11:37:53.923718
9	company_phone	09122334455	1	2026-08-27 11:37:53.92534
10	company_email	hamsaad@gmail.com	1	2026-08-27 11:37:53.926647
\.


--
-- Data for Name: complaint_messages; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.complaint_messages (id, complaint_id, sender_type, sender_id, sender_name, message, created_at) FROM stdin;
1	1	client	\N	Client	I have paid for the order but it is not yet delivered still waiting	2026-08-12 14:53:24.240275
2	2	client	\N	Client	Why is my order showing part payment when i payed in full?	2026-08-12 15:23:24.192409
3	3	client	\N	Client	admin how far	2026-08-12 15:32:09.580649
4	4	client	\N	Client	Your deliveries are slow, please improve on that	2026-08-12 15:48:13.308512
5	1	admin	\N	Admin	Please be a little patient. they are on their way	2026-08-12 14:54:05.498658
6	2	admin	\N	Admin	let me check 	2026-08-12 15:24:01.844426
7	3	admin	\N	Admin	at you door step	2026-08-12 15:32:39.198877
8	4	admin	\N	Admin	Okay thanks for the headsup	2026-08-12 15:48:46.580906
9	2	admin	1	System Administrator	This issue has been resolved now	2026-08-12 17:12:14.485357
10	5	client	1	Al-Amin Enterprises	Discount needed	2026-08-12 17:15:19.027641
11	5	admin	1	System Administrator	okay will give you on next order	2026-08-12 17:15:48.007345
12	5	client	1	Al-Amin Enterprises	okay thanks	2026-08-12 17:16:11.55711
13	5	admin	1	System Administrator	you welcome	2026-08-12 17:16:29.678917
14	6	client	1	Al-Amin Enterprises	Some of your items are expired	2026-08-12 23:32:23.937327
15	6	admin	1	System Administrator	sorry i will change them	2026-08-12 23:32:52.874539
16	7	client	4	Garba Karfe	Hello am still waiting for my order	2026-08-14 22:46:15.629046
17	7	admin	1	System Administrator	Its at your door step 	2026-08-14 22:46:53.108283
18	7	client	4	Garba Karfe	okay thanks	2026-08-14 22:47:22.074138
19	7	admin	1	System Administrator	u wlcm	2026-08-14 22:47:53.89648
20	8	client	1	Al-Amin Enterprises	Baose 1l was damaged	2026-08-16 21:10:56.529616
21	8	admin	1	System Administrator	Fix is on the way	2026-08-16 21:12:03.106404
22	9	client	3	Aspira	you need to improve your services please!!	2026-08-30 09:52:42.28544
23	9	admin	1	Admin	okay thanks for the heads up	2026-08-30 09:53:44.895739
24	9	client	3	Aspira	u wlcm	2026-08-30 09:54:16.756572
25	9	admin	1	Admin	pleasure	2026-08-30 09:55:52.592203
26	10	client	3	Aspira	still awaiting my order	2026-08-30 10:02:16.219985
27	10	admin	1	Admin	sorry on its way	2026-08-30 10:02:40.64899
28	10	client	3	Aspira	ok, received finally	2026-08-30 10:03:13.36362
29	10	admin	1	Admin	u wlcm	2026-08-30 10:03:26.781008
\.


--
-- Data for Name: daily_reports; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.daily_reports (id, report_date, opening_stock, closing_stock, goods_released, stock_received, total_items_released, notes, status, submitted_by, submitted_at, approved_by, approved_at, rejection_note, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: expenses; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.expenses (id, category, amount, description, payment_method, authorised_by, receipt_url, expense_date, recorded_by, created_at, updated_at) FROM stdin;
1	staff_welfare	50000.00	food	cash	Manager	\N	2026-08-26	4	2026-08-26 14:18:07.294573	2026-08-26 14:18:07.294573
\.


--
-- Data for Name: invoices; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.invoices (id, invoice_number, order_id, client_id, total_amount, payment_status, amount_paid, balance, due_date, notes, created_by, created_at, updated_at, subtotal, total_discount, payment_receipt_url, receipt_uploaded_at, receipt_approved_by, receipt_approved_at) FROM stdin;
17	HMS-INV-202608-0016	19	4	45720000.00	paid	0.00	\N	\N	\N	1	2026-08-16 20:59:41.204655	2026-08-16 20:59:41.204655	45800000.00	80000.00	\N	\N	1	2026-08-16 20:59:41.315
3	HMS-INV-202608-0003	3	2	2615000.00	paid	2615000.00	0.00	\N	\N	1	2026-08-08 20:01:17.695875	2026-08-08 20:10:35.735757	2615000.00	0.00	\N	\N	\N	\N
4	HMS-INV-202608-0004	4	3	46039200.00	unpaid	0.00	46039200.00	\N	\N	1	2026-08-08 20:21:31.938943	2026-08-08 20:21:31.938943	46039200.00	0.00	\N	\N	\N	\N
7	HMS-INV-202608-0006	9	1	10979840.00	paid	0.00	\N	\N	\N	\N	2026-08-12 14:50:15.267213	2026-08-12 14:51:13.91555	10979840.00	0.00	/uploads/1786542651399_625544784.pdf	2026-08-12 14:50:51.501232	1	2026-08-12 14:51:13.91555
8	HMS-INV-202608-0007	10	1	994000.00	paid	0.00	\N	\N	\N	\N	2026-08-12 15:21:37.038763	2026-08-12 15:23:37.905848	994000.00	0.00	/uploads/1786544512410_300414386.png	2026-08-12 15:21:52.595082	1	2026-08-12 15:23:37.905848
9	HMS-INV-202608-0008	11	1	3219952.00	paid	0.00	\N	\N	\N	\N	2026-08-12 15:38:54.335836	2026-08-12 15:40:45.852496	3219952.00	0.00	/uploads/1786545567795_138449709.jpeg	2026-08-12 15:39:27.811005	1	2026-08-12 15:40:45.852496
10	HMS-INV-202608-0009	12	1	1903968.00	paid	0.00	\N	\N	\N	\N	2026-08-12 17:23:36.477554	2026-08-12 17:30:57.648145	1903968.00	0.00	/uploads/1786551827109_910026892.png	2026-08-12 17:23:47.241729	1	2026-08-12 17:30:57.648145
6	HMS-INV-202608-0005	8	1	14679260.00	paid	0.00	\N	\N	\N	1	2026-08-12 13:44:12.617893	2026-08-12 17:31:07.5057	14709760.00	30500.00	/uploads/1786551452928_74474635.jpeg	2026-08-12 17:17:32.9646	1	2026-08-12 17:31:07.5057
11	HMS-INV-202608-0010	13	1	1835968.00	paid	0.00	\N	\N	\N	\N	2026-08-12 17:45:38.905463	2026-08-12 17:46:36.889211	1835968.00	0.00	/uploads/1786553151807_859401234.pdf	2026-08-12 17:45:51.906971	1	2026-08-12 17:46:36.889211
1	HMS-INV-202608-0001	1	1	75000.00	paid	0.00	75000.00	\N	\N	1	2026-08-05 20:51:39.247182	2026-08-12 17:46:45.597263	75000.00	0.00	/uploads/1786552599034_212146363.pdf	2026-08-12 17:36:39.052814	1	2026-08-12 17:46:45.597263
14	HMS-INV-202608-0013	16	3	1159500.00	paid	0.00	\N	\N	\N	1	2026-08-12 23:49:40.520705	2026-08-12 23:49:40.520705	1160000.00	500.00	\N	\N	1	2026-08-12 23:49:40.644
13	HMS-INV-202608-0012	15	2	3403500.00	paid	0.00	\N	\N	\N	1	2026-08-12 22:44:00.553309	2026-08-12 23:51:06.792721	3430000.00	26500.00	/uploads/1786575066727-113940072.png	\N	1	2026-08-12 23:51:06.790149
2	HMS-INV-202608-0002	2	1	375000.00	paid	350000.00	25000.00	\N	\N	1	2026-08-05 21:29:12.480757	2026-08-12 23:52:49.888972	375000.00	0.00	/uploads/1786575169851-544802483.png	\N	1	2026-08-12 23:52:49.887022
18	HMS-INV-202608-0017	20	1	10219872.00	paid	0.00	\N	\N	\N	\N	2026-08-16 21:01:46.3715	2026-08-16 21:04:01.694324	10219872.00	0.00	/uploads/1786910606996_893804652.png	2026-08-16 21:03:27.074303	1	2026-08-16 21:04:01.680485
12	HMS-INV-202608-0011	14	1	520000.00	paid	0.00	\N	\N	\N	\N	2026-08-12 17:52:37.340613	2026-08-14 14:52:01.87871	520000.00	0.00	/uploads/1786715521824-977132030.png	\N	1	2026-08-14 14:52:01.877135
15	HMS-INV-202608-0014	17	4	10259840.00	paid	0.00	\N	\N	\N	\N	2026-08-14 22:31:23.60258	2026-08-14 22:35:07.814879	10259840.00	0.00	/uploads/1786743125530_742526690.png	2026-08-14 22:32:05.637829	1	2026-08-14 22:35:07.760579
19	HMS-INV-202608-0018	21	4	125000.00	paid	0.00	\N	\N	\N	\N	2026-08-23 19:27:57.415583	2026-08-23 19:28:50.84563	125000.00	0.00	/uploads/1787509702252_648898917.png	2026-08-23 19:28:22.344448	1	2026-08-23 19:28:50.791791
20	HMS-INV-202608-0019	22	4	3705936.00	paid	0.00	\N	\N	\N	\N	2026-08-23 21:28:43.686272	2026-08-23 21:30:41.02042	3705936.00	0.00	/uploads/1787516936870_749455926.png	2026-08-23 21:28:56.965871	1	2026-08-23 21:30:41.012003
21	HMS-INV-202608-0020	23	4	75000.00	paid	0.00	\N	\N	\N	\N	2026-08-23 21:47:15.149017	2026-08-23 21:48:38.526542	75000.00	0.00	/uploads/1787518046503_965747716.png	2026-08-23 21:47:26.595992	1	2026-08-23 21:48:38.467878
22	HMS-INV-202608-0021	24	3	12475000.00	paid	0.00	\N	\N	\N	1	2026-08-27 11:48:34.476227	2026-08-27 11:48:34.476227	12500000.00	25000.00	\N	\N	1	2026-08-27 11:48:34.636
16	HMS-INV-202608-0015	18	4	260000.00	paid	0.00	\N	\N	\N	\N	2026-08-14 22:45:25.871314	2026-08-27 12:07:28.286785	260000.00	0.00	/uploads/1787828848177-601347798.png	\N	1	2026-08-27 12:07:28.285303
23	HMS-INV-202608-0022	25	1	3666000.00	paid	0.00	\N	\N	\N	1	2026-08-27 15:48:21.506313	2026-08-27 15:48:21.506313	3666000.00	0.00	\N	\N	1	2026-08-27 15:48:21.558
24	HMS-INV-202608-0023	26	4	9992000.00	paid	0.00	\N	\N	\N	1	2026-08-27 21:46:50.095523	2026-08-27 21:46:50.095523	10000000.00	8000.00	\N	\N	1	2026-08-27 21:46:50.245
25	HMS-INV-202608-0024	27	3	8999840.00	paid	0.00	\N	\N	\N	1	2026-08-27 21:59:21.994127	2026-08-27 21:59:21.994127	8999840.00	0.00	\N	\N	1	2026-08-27 21:59:22.092
27	HMS-INV-202608-0026	29	1	1142000.00	paid	0.00	\N	\N	\N	\N	2026-08-27 22:15:44.832271	2026-08-27 22:17:44.128159	1142000.00	0.00	/uploads/1787865412243_624242351.png	2026-08-27 22:16:52.320599	1	2026-08-27 22:17:44.12253
28	HMS-INV-202608-0027	30	2	500000.00	paid	0.00	\N	\N	\N	1	2026-08-28 11:53:47.899097	2026-08-28 11:54:02.161311	500000.00	0.00	/uploads/1787914442124-251847252.png	\N	1	2026-08-28 11:54:02.159106
26	HMS-INV-202608-0025	28	1	364000.00	paid	0.00	\N	\N	\N	\N	2026-08-27 22:00:27.10582	2026-08-28 14:50:30.137305	364000.00	0.00	/uploads/1787925030113-740477403.png	\N	1	2026-08-28 14:50:30.136607
29	HMS-INV-202608-0028	31	3	202500.00	paid	0.00	\N	\N	\N	1	2026-08-28 14:52:12.629451	2026-08-28 14:52:12.629451	202500.00	0.00	\N	\N	1	2026-08-28 14:52:12.717
30	HMS-INV-202608-0029	32	3	520000.00	paid	0.00	\N	\N	\N	1	2026-08-28 15:05:14.518038	2026-08-28 15:05:14.518038	520000.00	0.00	\N	\N	1	2026-08-28 15:05:14.628
31	HMS-INV-202608-0030	33	6	275000.00	paid	0.00	\N	\N	\N	1	2026-08-28 17:09:02.414392	2026-08-28 17:09:02.414392	275000.00	0.00	\N	\N	1	2026-08-28 17:09:02.57
32	HMS-INV-202608-0031	34	6	1040000.00	paid	0.00	\N	\N	\N	1	2026-08-28 17:13:31.213122	2026-08-28 17:13:31.213122	1040000.00	0.00	\N	\N	1	2026-08-28 17:13:31.227
33	HMS-INV-202608-0032	35	7	10292000.00	paid	0.00	\N	\N	\N	1	2026-08-30 09:23:36.071898	2026-08-30 09:23:36.071898	10300000.00	8000.00	\N	\N	1	2026-08-30 09:23:36.16
34	HMS-INV-202608-0033	36	3	4040436.00	paid	0.00	\N	\N	\N	\N	2026-08-30 09:24:59.302457	2026-08-30 09:27:35.634036	4040436.00	0.00	/uploads/1788078408291_349604207.png	2026-08-30 09:26:48.408338	1	2026-08-30 09:27:35.619837
\.


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.products (id, name, brand_id, category_id, size_variant, unit, cost_price, selling_price, quantity_in_stock, minimum_threshold, description, is_active, created_by, created_at, updated_at) FROM stdin;
9	Mobil special 2T	3	7	1L	Carton	9000.00	12000.00	114	500	\N	t	1	2026-08-11 14:31:20.544746	2026-08-27 22:20:07.640321
10	Mobil Super 2000	3	7	1L	Carton	8000.00	11000.00	0	500	\N	t	1	2026-08-11 14:32:55.797087	2026-08-27 22:20:07.640321
1	Total Quartz 5W-40	1	1	4L	Carton	12000.00	15000.00	230	500	Total Quartz engine oil 4 litres	t	1	2026-08-05 16:25:30.730071	2026-08-27 22:20:07.640321
15	MAX6	8	8	1l	Carton	20000.00	25000.00	503	500	\N	t	1	2026-08-16 20:50:34.9954	2026-08-30 09:31:06.624773
13	Mobil 1	3	7	1L	Carton	10500.00	13500.00	171	500	\N	t	1	2026-08-11 14:35:52.501839	2026-08-30 09:31:06.624773
14	Mobil 1 ESP	3	7	1L	Carton	12500.00	16000.00	63	500	\N	t	1	2026-08-11 14:36:38.168397	2026-08-30 09:31:06.624773
7	Mobil ENG	3	7	1L	Carton	10000.00	12000.00	38	500	\N	t	1	2026-08-11 14:28:46.729335	2026-08-30 09:31:06.624773
5	Hydraulic Dot 3	3	6	208	Drum	850000.00	899984.00	240	100	\N	t	1	2026-08-08 20:18:25.304637	2026-08-30 09:45:51.500187
12	Mobil Motor40	3	7	1L	Carton	19000.00	23000.00	114	500	\N	t	1	2026-08-11 14:34:37.794813	2026-08-16 20:52:09.871917
8	Mobil Special	3	7	1L	Carton	13000.00	15000.00	93	500	\N	t	1	2026-08-11 14:30:36.926424	2026-08-14 22:43:24.751889
11	Mobil Super 3000	3	7	1L	Carton	8500.00	10000.00	268	500	\N	t	1	2026-08-11 14:33:50.011473	2026-08-19 23:03:24.700121
4	Mobil 	3	1	1L	Carton	50000.00	52000.00	648	500	\N	t	1	2026-08-08 19:58:47.273074	2026-08-30 09:46:19.366208
\.


--
-- Data for Name: order_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.order_items (id, order_id, product_id, quantity, unit_price, total_price, created_at, discount_per_unit, discounted_price, product_name) FROM stdin;
1	1	1	5	15000.00	75000.00	2026-08-05 20:51:39.247182	0.00	\N	Total Quartz 5W-40
2	2	1	25	15000.00	375000.00	2026-08-05 21:29:12.480757	0.00	\N	Total Quartz 5W-40
3	3	4	50	52000.00	2600000.00	2026-08-08 20:01:17.695875	0.00	\N	Mobil 
4	3	1	1	15000.00	15000.00	2026-08-08 20:01:17.695875	0.00	\N	Total Quartz 5W-40
5	4	5	50	899984.00	44999200.00	2026-08-08 20:21:31.938943	0.00	\N	Hydraulic Dot 3
6	4	4	20	52000.00	1040000.00	2026-08-08 20:21:31.938943	0.00	\N	Mobil 
9	8	5	15	899984.00	13496760.00	2026-08-12 13:44:12.617893	200.00	899784.00	Hydraulic Dot 3
10	8	10	110	11000.00	1182500.00	2026-08-12 13:44:12.617893	250.00	10750.00	Mobil Super 2000
11	9	4	30	52000.00	1560000.00	2026-08-12 14:50:15.267213	0.00	52000.00	Mobil 
12	9	5	10	899984.00	8999840.00	2026-08-12 14:50:15.267213	0.00	899984.00	Hydraulic Dot 3
13	9	13	20	13500.00	270000.00	2026-08-12 14:50:15.267213	0.00	13500.00	Mobil 1
14	9	1	10	15000.00	150000.00	2026-08-12 14:50:15.267213	0.00	15000.00	Total Quartz 5W-40
15	10	4	10	52000.00	520000.00	2026-08-12 15:21:37.038763	0.00	52000.00	Mobil 
16	10	13	10	13500.00	135000.00	2026-08-12 15:21:37.038763	0.00	13500.00	Mobil 1
17	10	14	7	16000.00	112000.00	2026-08-12 15:21:37.038763	0.00	16000.00	Mobil 1 ESP
18	10	7	2	12000.00	24000.00	2026-08-12 15:21:37.038763	0.00	12000.00	Mobil ENG
19	10	12	3	23000.00	69000.00	2026-08-12 15:21:37.038763	0.00	23000.00	Mobil Motor40
20	10	8	3	15000.00	45000.00	2026-08-12 15:21:37.038763	0.00	15000.00	Mobil Special
21	10	9	3	12000.00	36000.00	2026-08-12 15:21:37.038763	0.00	12000.00	Mobil special 2T
22	10	10	3	11000.00	33000.00	2026-08-12 15:21:37.038763	0.00	11000.00	Mobil Super 2000
23	10	11	2	10000.00	20000.00	2026-08-12 15:21:37.038763	0.00	10000.00	Mobil Super 3000
24	11	4	10	52000.00	520000.00	2026-08-12 15:38:54.335836	0.00	52000.00	Mobil 
25	11	5	3	899984.00	2699952.00	2026-08-12 15:38:54.335836	0.00	899984.00	Hydraulic Dot 3
26	12	4	2	52000.00	104000.00	2026-08-12 17:23:36.477554	0.00	52000.00	Mobil 
27	12	5	2	899984.00	1799968.00	2026-08-12 17:23:36.477554	0.00	899984.00	Hydraulic Dot 3
28	13	5	2	899984.00	1799968.00	2026-08-12 17:45:38.905463	0.00	899984.00	Hydraulic Dot 3
29	13	7	3	12000.00	36000.00	2026-08-12 17:45:38.905463	0.00	12000.00	Mobil ENG
30	14	4	10	52000.00	520000.00	2026-08-12 17:52:37.340613	0.00	52000.00	Mobil 
31	15	13	100	13500.00	1330000.00	2026-08-12 22:44:00.553309	200.00	13300.00	Mobil 1
32	15	14	130	16000.00	2073500.00	2026-08-12 22:44:00.553309	50.00	15950.00	Mobil 1 ESP
33	16	7	50	12000.00	599500.00	2026-08-12 23:49:40.520705	10.00	11990.00	Mobil ENG
34	16	14	35	16000.00	560000.00	2026-08-12 23:49:40.520705	0.00	16000.00	Mobil 1 ESP
35	17	4	10	52000.00	520000.00	2026-08-14 22:31:23.60258	0.00	52000.00	Mobil 
36	17	5	10	899984.00	8999840.00	2026-08-14 22:31:23.60258	0.00	899984.00	Hydraulic Dot 3
37	17	13	2	13500.00	27000.00	2026-08-14 22:31:23.60258	0.00	13500.00	Mobil 1
38	17	14	3	16000.00	48000.00	2026-08-14 22:31:23.60258	0.00	16000.00	Mobil 1 ESP
39	17	7	4	12000.00	48000.00	2026-08-14 22:31:23.60258	0.00	12000.00	Mobil ENG
40	17	12	9	23000.00	207000.00	2026-08-14 22:31:23.60258	0.00	23000.00	Mobil Motor40
41	17	8	7	15000.00	105000.00	2026-08-14 22:31:23.60258	0.00	15000.00	Mobil Special
42	17	9	6	12000.00	72000.00	2026-08-14 22:31:23.60258	0.00	12000.00	Mobil special 2T
43	17	10	8	11000.00	88000.00	2026-08-14 22:31:23.60258	0.00	11000.00	Mobil Super 2000
44	17	11	7	10000.00	70000.00	2026-08-14 22:31:23.60258	0.00	10000.00	Mobil Super 3000
45	17	1	5	15000.00	75000.00	2026-08-14 22:31:23.60258	0.00	15000.00	Total Quartz 5W-40
46	18	4	5	52000.00	260000.00	2026-08-14 22:45:25.871314	0.00	52000.00	Mobil 
47	19	15	1000	25000.00	25000000.00	2026-08-16 20:59:41.204655	0.00	25000.00	MAX6
48	19	4	400	52000.00	20720000.00	2026-08-16 20:59:41.204655	200.00	51800.00	Mobil 
49	20	15	100	25000.00	2500000.00	2026-08-16 21:01:46.3715	0.00	25000.00	MAX6
50	20	4	10	52000.00	520000.00	2026-08-16 21:01:46.3715	0.00	52000.00	Mobil 
51	20	5	8	899984.00	7199872.00	2026-08-16 21:01:46.3715	0.00	899984.00	Hydraulic Dot 3
52	21	15	5	25000.00	125000.00	2026-08-23 19:27:57.415583	0.00	25000.00	MAX6
53	22	4	1	52000.00	52000.00	2026-08-23 21:28:43.686272	0.00	52000.00	Mobil 
54	22	5	4	899984.00	3599936.00	2026-08-23 21:28:43.686272	0.00	899984.00	Hydraulic Dot 3
55	22	13	4	13500.00	54000.00	2026-08-23 21:28:43.686272	0.00	13500.00	Mobil 1
56	23	15	3	25000.00	75000.00	2026-08-23 21:47:15.149017	0.00	25000.00	MAX6
57	24	15	500	25000.00	12475000.00	2026-08-27 11:48:34.476227	50.00	24950.00	MAX6
58	25	15	100	25000.00	2500000.00	2026-08-27 15:48:21.506313	0.00	25000.00	MAX6
59	25	10	106	11000.00	1166000.00	2026-08-27 15:48:21.506313	0.00	11000.00	Mobil Super 2000
60	26	15	400	25000.00	9992000.00	2026-08-27 21:46:50.095523	20.00	24980.00	MAX6
61	27	5	10	899984.00	8999840.00	2026-08-27 21:59:21.994127	0.00	899984.00	Hydraulic Dot 3
62	28	4	7	52000.00	364000.00	2026-08-27 22:00:27.10582	0.00	52000.00	Mobil 
63	29	15	10	25000.00	250000.00	2026-08-27 22:15:44.832271	0.00	25000.00	MAX6
64	29	13	10	13500.00	135000.00	2026-08-27 22:15:44.832271	0.00	13500.00	Mobil 1
65	29	14	31	16000.00	496000.00	2026-08-27 22:15:44.832271	0.00	16000.00	Mobil 1 ESP
66	29	9	10	12000.00	120000.00	2026-08-27 22:15:44.832271	0.00	12000.00	Mobil special 2T
67	29	10	6	11000.00	66000.00	2026-08-27 22:15:44.832271	0.00	11000.00	Mobil Super 2000
68	29	1	5	15000.00	75000.00	2026-08-27 22:15:44.832271	0.00	15000.00	Total Quartz 5W-40
69	30	15	20	25000.00	500000.00	2026-08-28 11:53:47.899097	0.00	25000.00	MAX6
70	31	13	15	13500.00	202500.00	2026-08-28 14:52:12.629451	0.00	13500.00	Mobil 1
71	32	4	10	52000.00	520000.00	2026-08-28 15:05:14.518038	0.00	52000.00	Mobil 
72	33	15	11	25000.00	275000.00	2026-08-28 17:09:02.414392	0.00	25000.00	MAX6
73	34	4	20	52000.00	1040000.00	2026-08-28 17:13:31.213122	0.00	52000.00	Mobil 
74	35	15	100	25000.00	2495000.00	2026-08-30 09:23:36.071898	50.00	24950.00	MAX6
75	35	4	150	52000.00	7797000.00	2026-08-30 09:23:36.071898	20.00	51980.00	Mobil 
76	36	15	4	25000.00	100000.00	2026-08-30 09:24:59.302457	0.00	25000.00	MAX6
77	36	4	4	52000.00	208000.00	2026-08-30 09:24:59.302457	0.00	52000.00	Mobil 
78	36	5	4	899984.00	3599936.00	2026-08-30 09:24:59.302457	0.00	899984.00	Hydraulic Dot 3
79	36	13	3	13500.00	40500.00	2026-08-30 09:24:59.302457	0.00	13500.00	Mobil 1
80	36	14	2	16000.00	32000.00	2026-08-30 09:24:59.302457	0.00	16000.00	Mobil 1 ESP
81	36	7	5	12000.00	60000.00	2026-08-30 09:24:59.302457	0.00	12000.00	Mobil ENG
\.


--
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.payments (id, receipt_number, invoice_id, client_id, amount, payment_method, reference_number, bank_name, is_banked, banked_at, teller_name, notes, recorded_by, created_at) FROM stdin;
1	HMS-RCP-0001	2	1	350000.00	cash	\N	\N	f	\N	\N	25,000 naira balance	4	2026-08-06 11:39:17.677377
2	HMS-RCP-0002	3	2	2615000.00	cash	\N	\N	f	\N	\N	paid in full	4	2026-08-08 20:10:35.735757
\.


--
-- Data for Name: petty_cash; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.petty_cash (id, transaction_type, amount, balance_after, expense_id, note, transaction_date, recorded_by, created_at) FROM stdin;
\.


--
-- Data for Name: price_alerts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.price_alerts (id, alert_type, brand_name, message, products, sent_to, sent_by, created_at) FROM stdin;
1	brand	The products will be changing in the coming days. Please contact us for more information.	Price Update Notice: The price of all The products will be changing in the coming days. Please contact us for more information. products will be changing in the coming days. Please contact us for more information.	[{"name": "", "direction": "increase"}]	All Clients	1	2026-08-12 22:40:53.883664+01
2	product	\N	Price Update Notice:\n\n• Hydraulic Dot 3: Price Increase ↑\n• Mobil 1 ESP: Price Decrease ↓\n• Total Quartz 5W-40: Price Increase ↑\n\nPlease contact us for more details.	[{"name": "Hydraulic Dot 3", "direction": "increase", "product_id": "5"}, {"name": "Mobil 1 ESP", "direction": "decrease", "product_id": "14"}, {"name": "Total Quartz 5W-40", "direction": "increase", "product_id": "1"}]	All Clients	1	2026-08-12 22:58:10.766011+01
3	brand	Castrol	Price Update Notice: The price of all Castrol products will be changing in the coming days. Please contact us for more information.	[{"name": "", "direction": "increase", "product_id": ""}]	All Clients	1	2026-08-12 23:02:36.623854+01
4	brand	Oando	Price Update Notice: The price of all Oando products will be changing in the coming days. Please contact us for more information.	[{"name": "", "direction": "increase", "product_id": ""}]	All Clients	1	2026-08-12 23:31:46.288077+01
5	brand	Castrol	Price Update Notice: The price of all Castrol products will be changing in the coming days. Please contact us for more information.	[{"name": "", "direction": "increase", "product_id": ""}]	All Clients	1	2026-08-14 22:48:43.531525+01
6	product	\N	Price Update Notice:\n\n• Mobil Motor40: Price Increase ↑\n• Mobil Super 2000: Price Increase ↑\n• Total Quartz 5W-40: Price Increase ↑\n• Mobil ENG: Price Increase ↑\n\nPlease contact us for more details.	[{"name": "Mobil Motor40", "direction": "increase", "product_id": "12"}, {"name": "Mobil Super 2000", "direction": "increase", "product_id": "10"}, {"name": "Total Quartz 5W-40", "direction": "increase", "product_id": "1"}, {"name": "Mobil ENG", "direction": "increase", "product_id": "7"}]	Garba Karfe	1	2026-08-14 22:50:20.291776+01
7	brand	BAOSE	Price Update Notice: The price of all BAOSE products will be changing in the coming days. Please contact us for more information.	[{"name": "", "direction": "increase", "product_id": ""}]	Garba Karfe	1	2026-08-16 21:14:39.119841+01
8	product	\N	Price Update Notice:\n\n• MAX6: Price Increase ↑\n• Total Quartz 5W-40: Price Increase ↑\n• Mobil Super 3000: Price Decrease ↓\n\nPlease contact us for more details.	[{"name": "MAX6", "direction": "increase", "product_id": "15"}, {"name": "Total Quartz 5W-40", "direction": "increase", "product_id": "1"}, {"name": "Mobil Super 3000", "direction": "decrease", "product_id": "11"}]	All Clients	1	2026-08-16 21:16:36.117337+01
\.


--
-- Data for Name: stock_movements; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.stock_movements (id, product_id, movement_type, quantity, quantity_before, quantity_after, reference_id, reference_type, note, performed_by, confirmed_by, created_at) FROM stdin;
1	1	stock_in	50	0	50	\N	\N	Initial stock entry	1	\N	2026-08-05 16:25:30.776552
2	1	stock_out	25	50	25	2	order	Released for order HMS-ORD-202608-0002	3	\N	2026-08-06 11:26:02.989901
5	4	stock_in	500	0	500	\N	\N	Initial stock entry	1	\N	2026-08-08 19:58:47.326912
6	1	stock_in	50	25	75	\N	\N	Supplied from Alh bashir	2	\N	2026-08-08 20:05:39.271035
7	4	stock_out	50	500	450	3	order	Released for order HMS-ORD-202608-0003	3	\N	2026-08-08 20:07:11.509869
8	1	stock_out	1	75	74	3	order	Released for order HMS-ORD-202608-0003	3	\N	2026-08-08 20:07:11.509869
9	5	stock_in	20	0	20	\N	\N	Initial stock entry	1	\N	2026-08-08 20:18:25.354288
10	5	stock_in	50	20	70	\N	\N	Stock addition	1	\N	2026-08-08 20:18:59.674146
11	5	stock_out	50	70	20	4	order	Released for order HMS-ORD-202608-0004	3	\N	2026-08-08 20:25:55.538837
12	4	stock_out	20	450	430	4	order	Released for order HMS-ORD-202608-0004	3	\N	2026-08-08 20:25:55.538837
14	7	stock_in	100	0	100	\N	\N	Initial stock entry	1	\N	2026-08-11 14:28:46.740473
15	8	stock_in	100	0	100	\N	\N	Initial stock entry	1	\N	2026-08-11 14:30:36.933878
16	9	stock_in	130	0	130	\N	\N	Initial stock entry	1	\N	2026-08-11 14:31:20.553481
17	10	stock_in	120	0	120	\N	\N	Initial stock entry	1	\N	2026-08-11 14:32:55.803653
18	11	stock_in	250	0	250	\N	\N	Initial stock entry	1	\N	2026-08-11 14:33:50.021356
19	12	stock_in	98	0	98	\N	\N	Initial stock entry	1	\N	2026-08-11 14:34:37.799419
20	13	stock_in	190	0	190	\N	\N	Initial stock entry	1	\N	2026-08-11 14:35:52.509626
21	14	stock_in	134	0	134	\N	\N	Initial stock entry	1	\N	2026-08-11 14:36:38.177178
22	4	adjustment	10	430	420	\N	\N	Wrong entry correction	1	\N	2026-08-11 22:50:22.761963
23	12	stock_in	25	98	123	\N	\N	Stock addition	3	\N	2026-08-14 15:42:46.650125
24	4	stock_in	20	420	440	\N	\N	New stock Mobil 1L	3	\N	2026-08-14 15:43:54.576682
25	7	stock_out	50	100	50	16	order	Released for order HMS-INV-202608-0013	3	\N	2026-08-14 16:29:05.178978
26	14	stock_out	35	134	99	16	order	Released for order HMS-INV-202608-0013	3	\N	2026-08-14 16:29:05.178978
27	5	stock_out	2	20	18	13	order	Released for order HMS-INV-202608-0010	3	\N	2026-08-14 16:55:53.232085
28	7	stock_out	3	50	47	13	order	Released for order HMS-INV-202608-0010	3	\N	2026-08-14 16:55:53.232085
29	4	stock_in	5	440	445	\N	\N	deliveries from total energies	3	\N	2026-08-14 22:04:05.954188
30	4	stock_out	10	445	435	17	order	Released for order HMS-INV-202608-0014	3	\N	2026-08-14 22:43:24.751889
31	5	stock_out	10	18	8	17	order	Released for order HMS-INV-202608-0014	3	\N	2026-08-14 22:43:24.751889
32	13	stock_out	2	190	188	17	order	Released for order HMS-INV-202608-0014	3	\N	2026-08-14 22:43:24.751889
33	14	stock_out	3	99	96	17	order	Released for order HMS-INV-202608-0014	3	\N	2026-08-14 22:43:24.751889
34	7	stock_out	4	47	43	17	order	Released for order HMS-INV-202608-0014	3	\N	2026-08-14 22:43:24.751889
35	12	stock_out	9	123	114	17	order	Released for order HMS-INV-202608-0014	3	\N	2026-08-14 22:43:24.751889
36	8	stock_out	7	100	93	17	order	Released for order HMS-INV-202608-0014	3	\N	2026-08-14 22:43:24.751889
37	9	stock_out	6	130	124	17	order	Released for order HMS-INV-202608-0014	3	\N	2026-08-14 22:43:24.751889
38	10	stock_out	8	120	112	17	order	Released for order HMS-INV-202608-0014	3	\N	2026-08-14 22:43:24.751889
39	11	stock_out	7	250	243	17	order	Released for order HMS-INV-202608-0014	3	\N	2026-08-14 22:43:24.751889
40	1	stock_out	5	74	69	17	order	Released for order HMS-INV-202608-0014	3	\N	2026-08-14 22:43:24.751889
41	15	stock_in	1000	0	1000	\N	\N	Initial stock entry	1	\N	2026-08-16 20:50:35.00463
42	15	adjustment	200	1000	800	\N	\N	Wrong entry correction	1	\N	2026-08-16 20:53:57.000346
43	15	stock_in	300	800	1100	\N	\N	Stock addition	1	\N	2026-08-16 20:54:12.761405
44	15	stock_in	95	1100	1195	1	stock_receipt	Stock receipt #1 — Unknown supplier	1	\N	2026-08-19 22:47:26.045894
45	15	adjustment	5	1100	1100	1	stock_receipt_defect	Defective items rejected — receipt #1: leaking containers	1	\N	2026-08-19 22:47:26.045894
46	1	stock_in	18	69	87	3	stock_receipt	Receipt #3 — Total energies	1	\N	2026-08-19 23:03:24.700121
47	1	adjustment	2	69	69	3	stock_receipt_defect	Defective items — receipt #3: broken seals	1	\N	2026-08-19 23:03:24.700121
48	11	stock_in	25	243	268	3	stock_receipt	Receipt #3 — mobil	1	\N	2026-08-19 23:03:24.700121
49	11	adjustment	5	243	243	3	stock_receipt_defect	Defective items — receipt #3: contaminated	1	\N	2026-08-19 23:03:24.700121
50	1	stock_in	55	87	142	4	stock_receipt	Receipt #4 — Total Nig Ltd	1	\N	2026-08-21 11:15:16.823159
51	1	adjustment	5	87	87	4	stock_receipt_defect	Defective items — receipt #4: expired products	1	\N	2026-08-21 11:15:16.823159
52	15	stock_in	50	1195	1245	\N	\N	Stock addition	2	\N	2026-08-23 19:31:30.583295
53	4	stock_in	10	435	445	\N	\N	Stock addition	2	\N	2026-08-23 19:32:30.770263
54	5	stock_in	20	8	28	\N	\N	Stock addition	2	\N	2026-08-23 19:32:38.688969
55	15	stock_out	5	1245	1240	21	order	Released for order HMS-INV-202608-0018	3	\N	2026-08-23 20:59:33.674131
56	15	stock_out	100	1240	1140	20	order	Released for order HMS-INV-202608-0017	3	\N	2026-08-23 21:17:47.406648
57	4	stock_out	10	445	435	20	order	Released for order HMS-INV-202608-0017	3	\N	2026-08-23 21:17:47.406648
58	5	stock_out	8	28	20	20	order	Released for order HMS-INV-202608-0017	3	\N	2026-08-23 21:17:47.406648
59	4	stock_out	1	435	434	22	order	Released for order HMS-INV-202608-0019	3	\N	2026-08-23 21:38:49.269052
60	5	stock_out	4	20	16	22	order	Released for order HMS-INV-202608-0019	3	\N	2026-08-23 21:38:49.269052
61	13	stock_out	4	188	184	22	order	Released for order HMS-INV-202608-0019	3	\N	2026-08-23 21:38:49.269052
62	4	stock_out	10	434	424	14	order	Released for order HMS-INV-202608-0011	3	\N	2026-08-25 22:34:13.507553
63	4	stock_out	2	424	422	12	order	Released for order HMS-INV-202608-0009	3	\N	2026-08-26 14:08:42.781626
64	5	stock_out	2	16	14	12	order	Released for order HMS-INV-202608-0009	3	\N	2026-08-26 14:08:42.781626
65	5	stock_in	40	14	54	\N	\N	Stock addition	1	\N	2026-08-27 11:35:40.409946
66	15	stock_out	500	1140	640	24	order	Released for order HMS-INV-202608-0021	3	\N	2026-08-27 12:00:26.473906
67	15	stock_out	3	640	637	23	order	Released for order HMS-INV-202608-0020	3	\N	2026-08-27 12:09:59.593558
68	15	stock_out	100	637	537	25	order	Released for order HMS-INV-202608-0022	3	\N	2026-08-27 15:50:08.950127
69	10	stock_out	106	112	6	25	order	Released for order HMS-INV-202608-0022	3	\N	2026-08-27 15:50:08.950127
70	1	stock_in	93	142	235	5	stock_receipt	Receipt #5 — Total	1	\N	2026-08-27 21:41:13.754702
71	1	adjustment	7	142	142	5	stock_receipt_defect	Defective items — receipt #5: broken seal	1	\N	2026-08-27 21:41:13.754702
72	15	stock_out	400	537	137	26	order	Released for order HMS-INV-202608-0023	3	\N	2026-08-27 21:50:05.34691
73	5	stock_out	10	54	44	27	order	Released for order HMS-INV-202608-0024	3	\N	2026-08-27 22:02:42.473576
74	15	stock_out	10	137	127	29	order	Released for order HMS-INV-202608-0026	3	\N	2026-08-27 22:20:07.640321
75	13	stock_out	10	184	174	29	order	Released for order HMS-INV-202608-0026	3	\N	2026-08-27 22:20:07.640321
76	14	stock_out	31	96	65	29	order	Released for order HMS-INV-202608-0026	3	\N	2026-08-27 22:20:07.640321
77	9	stock_out	10	124	114	29	order	Released for order HMS-INV-202608-0026	3	\N	2026-08-27 22:20:07.640321
78	10	stock_out	6	6	0	29	order	Released for order HMS-INV-202608-0026	3	\N	2026-08-27 22:20:07.640321
79	1	stock_out	5	235	230	29	order	Released for order HMS-INV-202608-0026	3	\N	2026-08-27 22:20:07.640321
80	15	stock_out	20	127	107	30	order	Released for order HMS-INV-202608-0027	3	\N	2026-08-28 12:27:59.496092
81	15	stock_in	400	107	507	\N	\N	Stock addition	1	\N	2026-08-29 20:26:39.747173
82	4	stock_in	200	422	622	\N	\N	Stock addition	1	\N	2026-08-29 20:26:48.608328
83	4	stock_out	20	622	602	34	order	Released for order HMS-INV-202608-0031	3	\N	2026-08-29 20:49:49.266748
84	15	stock_out	4	507	503	36	order	Released for order HMS-INV-202608-0033	3	\N	2026-08-30 09:31:06.624773
85	4	stock_out	4	602	598	36	order	Released for order HMS-INV-202608-0033	3	\N	2026-08-30 09:31:06.624773
86	5	stock_out	4	44	40	36	order	Released for order HMS-INV-202608-0033	3	\N	2026-08-30 09:31:06.624773
87	13	stock_out	3	174	171	36	order	Released for order HMS-INV-202608-0033	3	\N	2026-08-30 09:31:06.624773
88	14	stock_out	2	65	63	36	order	Released for order HMS-INV-202608-0033	3	\N	2026-08-30 09:31:06.624773
89	7	stock_out	5	43	38	36	order	Released for order HMS-INV-202608-0033	3	\N	2026-08-30 09:31:06.624773
90	5	stock_in	200	40	240	\N	\N	Stock addition	1	\N	2026-08-30 09:45:51.503303
91	4	stock_in	50	598	648	\N	\N	Stock addition	1	\N	2026-08-30 09:46:19.413742
\.


--
-- Data for Name: stock_receipt_headers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.stock_receipt_headers (id, received_by, created_at, delivery_reference, delivery_date, general_notes) FROM stdin;
1	1	2026-08-19 22:47:26.045894	\N	2026-08-19	\N
3	1	2026-08-19 23:03:24.700121	LPO-22L-87	2026-08-19	Leaking iteam due to bad loading
4	1	2026-08-21 11:15:16.823159	001	2026-08-21	Expired Products
5	1	2026-08-27 21:41:13.754702	LPO-11111	2026-08-27	\N
\.


--
-- Data for Name: stock_receipt_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.stock_receipt_items (id, receipt_id, product_id, supplier_name, total_received, defective_quantity, accepted_quantity, defect_description, defect_images, notes, created_at) FROM stdin;
1	3	1	Total energies	20	2	18	broken seals	{/uploads/defect_1787177004645_848696792.jpeg}	\N	2026-08-19 23:03:24.700121
2	3	11	mobil	30	5	25	contaminated	{/uploads/defect_1787177004647_948383275.jpeg}	\N	2026-08-19 23:03:24.700121
3	4	1	Total Nig Ltd	60	5	55	expired products	\N	\N	2026-08-21 11:15:16.823159
4	5	1	Total	100	7	93	broken seal	{/uploads/defect_1787863273743_542753096.png}	\N	2026-08-27 21:41:13.754702
\.


--
-- Data for Name: waybills; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.waybills (id, waybill_number, order_id, collector_name, storekeeper_id, scanned_copy_url, signed_copy_url, manager_approved, approved_by, approved_at, notes, created_by, created_at, updated_at, is_approved, rejection_reason, rejected_at, rejected_by, delivery_note_url, signed_delivery_note_url) FROM stdin;
1	HMS-INV-202608-0001	1	\N	\N	\N	\N	f	\N	\N	\N	1	2026-08-05 20:51:39.247182	2026-08-05 20:51:39.247182	f	\N	\N	\N	\N	\N
2	HMS-INV-202608-0002	2	Kabiru Musa	3	/uploads/1786011809840-544252491.pdf	/uploads/1786011979989-926640365.pdf	t	2	2026-08-06 11:28:10.887823	\N	1	2026-08-05 21:29:12.480757	2026-08-06 11:28:10.887823	f	\N	\N	\N	\N	\N
17	HMS-INV-202608-0023	26	Musa Umar	\N	/uploads/1787863737862-227487817.png	/uploads/1787863938172-288643639.png	f	2	2026-08-27 21:52:30.198339	\N	2	2026-08-27 21:47:56.453681	2026-08-27 21:52:30.198339	t	wrong waybill	2026-08-27 21:51:40.300325	2	\N	\N
8	HMS-INV-202608-0012	15	\N	\N	/uploads/1787864283203-309582011.png	\N	f	\N	\N	\N	2	2026-08-14 15:32:27.508355	2026-08-27 21:58:03.216284	f	\N	\N	\N	\N	\N
4	HMS-INV-202608-0004	4	Usman Ahmad	3	\N	/uploads/1786217175946-889999992.png	f	\N	\N	\N	1	2026-08-08 20:21:31.938943	2026-08-08 20:26:15.976062	f	\N	\N	\N	\N	\N
18	HMS-INV-202608-0024	27	umar	\N	/uploads/1787864540120-193975474.png	/uploads/1787864673799-798707449.png	f	2	2026-08-27 22:13:34.512426	\N	2	2026-08-27 22:01:49.307653	2026-08-27 22:13:34.512426	t	\N	\N	\N	\N	\N
10	HMS-INV-202608-0018	21	\N	\N	\N	/uploads/1787515209699-334483478.png	f	\N	\N	\N	2	2026-08-23 20:58:39.508845	2026-08-23 21:00:09.714971	f	\N	\N	\N	\N	\N
9	HMS-INV-202608-0014	17	\N	\N	\N	/uploads/1786743815465-607620280.png	f	2	2026-08-23 21:14:02.472493	\N	2	2026-08-14 22:42:48.309371	2026-08-23 21:14:02.472493	t	\N	\N	\N	\N	\N
7	HMS-INV-202608-0013	16	\N	\N	\N	/uploads/1786741583547-491125494.png	f	2	2026-08-23 21:14:36.944741	\N	2	2026-08-14 15:32:27.508355	2026-08-23 21:14:36.944741	t	\N	\N	\N	\N	\N
11	HMS-INV-202608-0017	20	\N	\N	\N	/uploads/1787516420070-498806422.png	f	2	2026-08-23 21:21:17.81721	\N	2	2026-08-23 21:16:35.581734	2026-08-23 21:21:17.81721	t	\N	\N	\N	\N	\N
6	HMS-INV-202608-0010	13	\N	\N	\N	/uploads/1786723478574-592645618.png	f	2	2026-08-23 21:22:47.925381	\N	2	2026-08-14 15:29:07.265538	2026-08-23 21:22:47.925381	t	\N	\N	\N	\N	\N
12	HMS-INV-202608-0019	22	\N	\N	\N	/uploads/1787517548455-297143167.png	f	2	2026-08-23 21:39:31.658528	\N	2	2026-08-23 21:37:10.536416	2026-08-23 21:39:31.658528	t	\N	\N	\N	\N	\N
19	HMS-INV-202608-0026	29	\N	\N	/uploads/1787865556030-851923411.png	/uploads/1787865617175-240951237.png	f	2	2026-08-27 22:20:57.176881	\N	2	2026-08-27 22:18:53.892746	2026-08-27 22:20:57.176881	t	\N	\N	\N	\N	\N
5	HMS-INV-202608-0011	14	\N	\N	\N	/uploads/1787694366243-180546597.png	f	2	2026-08-25 22:46:35.37886	\N	2	2026-08-14 15:28:11.137875	2026-08-25 22:46:35.37886	t	wrong bill	2026-08-25 22:45:28.863811	2	\N	\N
23	HMS-INV-202608-0033	36	Ahmad Hassan	\N	/uploads/1788078591035-983490136.pdf	/uploads/1788078811269-134497540.pdf	f	2	2026-08-30 09:33:53.895598	\N	2	2026-08-30 09:29:04.467128	2026-08-30 09:33:53.895598	t	wrong documents	2026-08-30 09:32:31.063817	2	/uploads/1788078591053-637521029.pdf	/uploads/1788078684049-699420647.pdf
13	HMS-INV-202608-0009	12	\N	\N	\N	/uploads/1787749752123-914319280.png	f	2	2026-08-26 14:10:38.924561	\N	2	2026-08-26 14:07:57.671966	2026-08-26 14:10:38.924561	t	\N	\N	\N	\N	\N
3	HMS-INV-202608-0003	3	Hamza Bashir	3	\N	/uploads/1786216055226-219638530.png	f	2	2026-08-26 15:07:57.269078	\N	1	2026-08-08 20:01:17.695875	2026-08-26 15:07:57.269078	t	\N	\N	\N	\N	\N
20	HMS-INV-202608-0027	30	Saeed Hadi	\N	/uploads/1787915033561-213941136.png	/uploads/1787916512192-851019580.pdf	f	2	2026-08-28 12:29:01.355651	\N	2	2026-08-28 11:57:19.022644	2026-08-28 12:29:01.355651	t	\N	\N	\N	/uploads/1787916403610-805241410.png	\N
21	HMS-INV-202608-0029	32	Hadi Garba	\N	\N	\N	f	\N	\N	\N	2	2026-08-28 15:09:20.423236	2026-08-28 15:09:20.423236	f	\N	\N	\N	\N	\N
14	HMS-INV-202608-0021	24	Bala Kamal	\N	/uploads/1787828372273-249212240.png	/uploads/1787828530103-396927396.png	f	2	2026-08-27 12:02:49.07809	\N	2	2026-08-27 11:49:17.475175	2026-08-27 12:02:49.07809	t	wrong waybill uploaded	2026-08-27 12:01:36.382369	2	\N	\N
15	HMS-INV-202608-0020	23	umar hassan	\N	/uploads/1787828941907-641234320.png	/uploads/1787829019314-341170837.png	f	2	2026-08-27 12:10:33.771615	\N	2	2026-08-27 12:08:34.240437	2026-08-27 12:10:33.771615	t	\N	\N	\N	\N	\N
16	HMS-INV-202608-0022	25	Hamza Adamu	\N	/uploads/1787842173836-824799672.png	/uploads/1787842230704-684285422.png	f	2	2026-08-27 15:50:57.944575	\N	2	2026-08-27 15:49:08.575381	2026-08-27 15:50:57.944575	t	\N	\N	\N	\N	\N
22	HMS-INV-202608-0031	34	Aliyu Umar	\N	/uploads/1788032298870-595220063.jpg	/uploads/1788033148423-390886638.png	f	2	2026-08-29 20:57:42.876988	\N	2	2026-08-29 20:35:56.757269	2026-08-29 20:57:42.876988	t	\N	\N	\N	/uploads/1788032298912-411075624.jpg	/uploads/1788033148551-606040553.jpeg
\.


--
-- Name: audit_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.audit_logs_id_seq', 285, true);


--
-- Name: brands_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.brands_id_seq', 9, true);


--
-- Name: categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.categories_id_seq', 8, true);


--
-- Name: client_notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.client_notifications_id_seq', 66, true);


--
-- Name: clients_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.clients_id_seq', 7, true);


--
-- Name: company_settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.company_settings_id_seq', 10, true);


--
-- Name: complaint_messages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.complaint_messages_id_seq', 29, true);


--
-- Name: complaints_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.complaints_id_seq', 10, true);


--
-- Name: daily_reports_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.daily_reports_id_seq', 1, false);


--
-- Name: expenses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.expenses_id_seq', 1, true);


--
-- Name: invoices_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.invoices_id_seq', 34, true);


--
-- Name: order_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.order_items_id_seq', 81, true);


--
-- Name: orders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.orders_id_seq', 36, true);


--
-- Name: payments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.payments_id_seq', 2, true);


--
-- Name: petty_cash_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.petty_cash_id_seq', 1, false);


--
-- Name: price_alerts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.price_alerts_id_seq', 8, true);


--
-- Name: products_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.products_id_seq', 15, true);


--
-- Name: stock_movements_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.stock_movements_id_seq', 91, true);


--
-- Name: stock_receipt_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.stock_receipt_items_id_seq', 4, true);


--
-- Name: stock_receipts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.stock_receipts_id_seq', 5, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 4, true);


--
-- Name: waybills_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.waybills_id_seq', 23, true);


--
-- PostgreSQL database dump complete
--

\unrestrict vKMXbrs07aVeleTb8wjDrTC7dogKPanCbDU5aVLrG7yayBfmOcRbLL2V13DjL3U

