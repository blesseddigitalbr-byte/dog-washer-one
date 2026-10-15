export function assertQaDestination(target, source) {
  if (target.protocol !== 'postgresql:' || target.hostname !== 'aws-1-ca-central-1.pooler.supabase.com' || target.port !== '5432' || decodeURIComponent(target.username) !== 'postgres.bvmyovgourushalerpza' || target.pathname !== '/postgres' || target.search || target.hash || !target.password || target.hostname === source.hostname || target.username === source.username) throw new Error('Destination guard rejected target');
}

export function selectQaRestoreEntries(catalogue) {
  const appObject = /^(?:TYPE|DOMAIN|FUNCTION|PROCEDURE|AGGREGATE|TABLE|SEQUENCE|SEQUENCE OWNED BY|TABLE DATA|SEQUENCE SET|DEFAULT|CONSTRAINT|FK CONSTRAINT|INDEX|TRIGGER|RULE|POLICY|ROW SECURITY|VIEW|MATERIALIZED VIEW|STATISTICS) (?:public|private|supabase_migrations) /;
  return catalogue.filter(line => {
    const body = line.match(/^\d+; \d+ \d+ (.*)$/)?.[1];
    if (!body) return false;
    return appObject.test(body) || /^SCHEMA - (?:private|supabase_migrations) /.test(body) || /^ACL (?:public|private|supabase_migrations) /.test(body) || /^ACL - SCHEMA (?:public|private|supabase_migrations) /.test(body) || /^DEFAULT ACL (?:public|private|supabase_migrations) .* postgres$/.test(body) || /^TABLE DATA auth (?:users|identities) /.test(body) || /^TABLE DATA storage (?:buckets|objects) /.test(body) || /^TRIGGER auth users on_auth_user_created /.test(body);
  });
}
