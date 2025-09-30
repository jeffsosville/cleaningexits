import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import formidable from 'formidable';
import fs from 'fs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const config = { api: { bodyParser: false } };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const form = formidable({});
    const [fields, files] = await form.parse(req);

    const listing_id = fields.listing_id?.[0];
    const tenant_id = fields.tenant_id?.[0];
    const file = files.file?.[0];

    if (!file || !listing_id || !tenant_id) {
      return res.status(400).json({ error: 'Missing required data' });
    }

    const buffer = fs.readFileSync(file.filepath);
    const storagePath = `${tenant_id}/${listing_id}/${Date.now()}-${file.originalFilename}`;

    const { error: uploadError } = await supabase.storage
      .from('deal_rooms_v2')
      .upload(storagePath, buffer);

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return res.status(500).json({ error: uploadError.message });
    }

    const { data, error: dbError } = await supabase
      .from('deal_room_files_v2')
      .insert({
        tenant_id,
        listing_id,
        file_name: file.originalFilename,
        file_type: file.mimetype,
        storage_path: storagePath
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      return res.status(500).json({ error: dbError.message });
    }

    if (!data) {
      return res.status(500).json({ error: 'Insert succeeded but returned no data' });
    }

    fs.unlinkSync(file.filepath);

    return res.status(200).json({ 
      id: data.id, 
      file_name: file.originalFilename,
      message: 'Upload successful'
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    return res.status(500).json({ error: error.message });
  }
}
