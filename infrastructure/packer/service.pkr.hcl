source "docker" "typescript-sprint-zero-service" {
  changes     = ["EXPOSE 8000", "CMD [\"/run.sh\"]"]
  commit      = "true"
  image       = "debian:12-slim"
  run_command = ["-d", "-i", "-t", "--name", "packer-service", "{{.Image}}", "/bin/bash"]
}

variable "whl" {
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

  provisioner "file" {
    source = "dist/${var.whl}"
    destination = "/${var.whl}"
  }

  provisioner "file" {
    source = "run.sh"
    destination = "/run.sh"
  }

  post-processor "docker-tag" {
    repository = "svanosselaer/typescript-sprint-zero-service"
    tags       = ["latest", var.version]
  }
}
