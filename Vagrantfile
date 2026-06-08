require 'fileutils'

Vagrant.configure('2') do |config|
  config.vm.box = 'D3strukt0r/debian-docker'

  # Generate local TLS certs with mkcert (host-side). Runs only if a cert is
  # missing. Passing the SANs as separate args avoids the host shell globbing
  # the "*." wildcard against the working directory.
  cert = '.docker/certs/cert.pem'
  key  = '.docker/certs/key.pem'
  unless File.exist?(cert) && File.exist?(key)
    FileUtils.mkdir_p('.docker/certs')
    ok = system('mkcert', '-cert-file', cert, '-key-file', key,
                'localhost', 'd3strukt0r.test', '*.d3strukt0r.test')
    unless ok
      warn 'mkcert not found or failed -- install mkcert and re-run `vagrant up`, ' \
           'or create .docker/certs/{cert,key}.pem manually.'
    end
  end

  # --- Project-specific provisioning -----------------------------------------
  # App-data directory for the pnpm store (the pnpm container runs as 999:999).
  config.vm.provision 'create-app-data-folders', type: 'shell', privileged: false, inline: <<-SHELL
    set -e -u -x -o pipefail
    mkdir -p ~/data/pnpm
  SHELL
  config.vm.provision 'fix-app-data-permissions', type: 'shell', privileged: false, run: 'always', inline: <<-SHELL
    set -e -u -x -o pipefail
    sudo chown --recursive vagrant:vagrant ~/data
    sudo chown --recursive 999:999 ~/data/pnpm
  SHELL

  # Bootstrap the VM-specific compose file from its dist template (kept separate
  # from compose.yml so the synced /vagrant folder doesn't clobber it).
  config.vm.provision 'copy-dist-files', type: 'shell', privileged: false, run: 'always', inline: <<-SHELL
    set -e -u -x -o pipefail
    if [ ! -f /vagrant/compose.vm.yml ]; then
      cp /vagrant/compose.vm.dist.yml /vagrant/compose.vm.yml
    fi
  SHELL

  # The certs are generated on the host (above); warn if they didn't sync in.
  config.vm.provision 'check-certificates', type: 'shell', privileged: false, run: 'always', inline: <<-SHELL
    set -e -u -x -o pipefail
    if [ ! -f /vagrant/.docker/certs/cert.pem ] || [ ! -f /vagrant/.docker/certs/key.pem ]; then
      echo "WARNING: .docker/certs/{cert,key}.pem missing -- run mkcert on the host (see Vagrantfile)."
    fi
  SHELL
end
