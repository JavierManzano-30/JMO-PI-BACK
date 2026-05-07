import fs from 'node:fs';
import path from 'node:path';

const sqlPath = path.resolve(process.cwd(), 'sql', 'social_features_supabase.sql');

describe('social features Supabase schema', () => {
  let sql;

  beforeAll(() => {
    sql = fs.readFileSync(sqlPath, 'utf8');
  });

  test('define follows y mensajes directos con restricciones básicas', () => {
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS public.user_follows');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS public.direct_messages');
    expect(sql).toContain('CONSTRAINT chk_user_follows_no_self_follow CHECK (follower_id <> following_id)');
    expect(sql).toContain('CONSTRAINT uq_user_follows_pair UNIQUE (follower_id, following_id)');
    expect(sql).toContain('CONSTRAINT chk_direct_messages_no_self_message CHECK (sender_id <> receiver_id)');
  });

  test('habilita Row Level Security y políticas por usuario autenticado', () => {
    expect(sql).toContain('ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY');
    expect(sql).toContain('ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY');
    expect(sql).toContain('CREATE POLICY user_follows_insert_own');
    expect(sql).toContain('CREATE POLICY direct_messages_select_participants');
    expect(sql).toContain('CREATE POLICY direct_messages_insert_sender');
    expect(sql).toContain('sender_id = public.current_app_user_id()');
  });

  test('expone direct_messages en Supabase Realtime y recarga PostgREST', () => {
    expect(sql).toContain("ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages");
    expect(sql).toContain("NOTIFY pgrst, 'reload schema'");
  });
});
