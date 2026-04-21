FROM mcr.microsoft.com/devcontainers/ruby:1-3.2

# Refresh Yarn apt repo key.
#
# The base image ships /etc/apt/sources.list.d/yarn.list pointing at
# https://dl.yarnpkg.com/debian, but the signing key (62D54FD4003F6525) is
# no longer trusted in the image, so every `apt-get update` fails with:
#   NO_PUBKEY 62D54FD4003F6525
#   E: The repository 'https://dl.yarnpkg.com/debian stable InRelease' is not signed.
# That breaks the common-utils devcontainer feature (exit 100) before our
# own tooling ever runs.
#
# Fix: fetch the current Yarn pubkey, dearmor it into /usr/share/keyrings,
# and rewrite yarn.list with `signed-by=` so apt trusts it regardless of
# the stale system keyring. First `apt-get update` is allowed to fail
# (|| true) so we can install curl+gnupg before the key is repaired.
RUN set -eux; \
    apt-get update -o Acquire::AllowInsecureRepositories=true \
                   -o Acquire::AllowDowngradeToInsecureRepositories=true \
                   || true; \
    apt-get install -y --no-install-recommends ca-certificates curl gnupg; \
    install -d -m 0755 /usr/share/keyrings; \
    curl -fsSL https://dl.yarnpkg.com/debian/pubkey.gpg \
        | gpg --dearmor -o /usr/share/keyrings/yarnkey.gpg; \
    echo "deb [signed-by=/usr/share/keyrings/yarnkey.gpg] https://dl.yarnpkg.com/debian stable main" \
        > /etc/apt/sources.list.d/yarn.list; \
    rm -rf /var/lib/apt/lists/*; \
    apt-get update
