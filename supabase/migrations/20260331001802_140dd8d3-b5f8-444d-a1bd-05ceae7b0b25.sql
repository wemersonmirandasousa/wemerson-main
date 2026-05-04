
-- Allow anonymous uploads to wechat/ path in tool-images bucket
CREATE POLICY "Anyone can upload wechat files"
ON storage.objects FOR INSERT TO anon, authenticated
WITH CHECK (bucket_id = 'tool-images' AND (storage.foldername(name))[1] = 'wechat');
