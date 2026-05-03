{
  description = "d3strukt0r's portfolio — build/runtime toolchain";

  # Pinning the nixpkgs branch (not a SHA) lets `nix flake update` resolve the
  # latest commit on that branch and write it to flake.lock. Dependabot's nix
  # ecosystem watches flake.lock and opens a PR when that commit moves, which
  # transitively bumps nodejs, pnpm, and everything else we pull from here.
  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-25.11";

  outputs = { self, nixpkgs }:
    let
      forAllSystems = f: nixpkgs.lib.genAttrs
        [ "x86_64-linux" "aarch64-linux" ]
        (system: f (import nixpkgs { inherit system; }));
    in
    {
      devShells = forAllSystems (pkgs: {
        default = pkgs.mkShell {
          packages = [
            pkgs.nodejs_24
            pkgs.pnpm_10
            pkgs.wget
            pkgs.cacert
          ];
        };
      });

      packages = forAllSystems (pkgs: {
        # Minimal runtime closure: only what the production container executes.
        # No pnpm, no build tooling.
        # bash + coreutils + gnused are required by pnpm's node_modules/.bin/
        # shim scripts (they sed-parse $0 to locate the real entry point).
        runtime = pkgs.buildEnv {
          name = "runtime";
          paths = [
            pkgs.nodejs_24
            pkgs.bash
            pkgs.coreutils
            pkgs.gnused
            pkgs.wget
            pkgs.cacert
          ];
        };
      });
    };
}
