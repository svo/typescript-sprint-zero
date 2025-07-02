source "docker" "typescript-sprint-zero-service" {
  changes     = ["EXPOSE 3000", "CMD [\"/run.sh\"]"]
  commit      = "true"
  image       = "debian:12-slim"
  run_command = ["-d", "-i", "-t", "--name", "packer-service", "{{.Image}}", "/bin/bash"]
}

variable "artifact" {
  type = string
}

variable "version" {
  type = string
}

build {
  sources = ["source.docker.typescript-sprint-zero-service"]

  provisioner "shell" {
    inline = [
      "groupadd -g 1000 runner",
      "useradd -u 1000 -g 1000 -m runner"
    ]
  }

  provisioner "shell" {
    script = "bin/setup-image-requirements"
  }

  provisioner "ansible" {
    extra_arguments = ["--extra-vars", "ansible_host=packer-service ansible_connection=docker"]
    playbook_file   = "infrastructure/ansible/playbook-service.yml"
    user            = "root"
  }

  provisioner "shell" {
    inline = [
      "mkdir -p /app",
      "chown runner:runner /app"
    ]
  }

  provisioner "file" {
    source = "dist/${var.artifact}"
    destination = "/tmp/${var.artifact}"
  }

  provisioner "file" {
    source = "package.json"
    destination = "/tmp/package.json"
  }

  provisioner "file" {
    source = "package-lock.json"
    destination = "/tmp/package-lock.json"
  }

  provisioner "file" {
    source = "run.sh"
    destination = "/run.sh"
  }

  provisioner "shell" {
    inline = [
      "cd /tmp",
      "tar -xzf ${var.artifact} -C /app",
      "cp package.json package-lock.json /app/",
      "chmod +x /run.sh",
      "chown -R runner:runner /app"
    ]
  }

  post-processor "docker-tag" {
    repository = "svanosselaer/typescript-sprint-zero-service"
    tags       = ["latest", var.version]
  }
}
