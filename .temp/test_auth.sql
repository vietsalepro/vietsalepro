-- Test that auth.uid() can be set via request.jwt.claims
SET LOCAL request.jwt.claims = '{"sub":"00000000-0000-0000-0000-000000000000","role":"authenticated"}';
SELECT auth.uid() AS uid;
