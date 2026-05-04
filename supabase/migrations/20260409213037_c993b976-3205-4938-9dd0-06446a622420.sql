ALTER TABLE public.wechat_shares ADD COLUMN shared_by_name text DEFAULT NULL;
ALTER TABLE public.wechat_shares ADD COLUMN device_info text DEFAULT NULL;