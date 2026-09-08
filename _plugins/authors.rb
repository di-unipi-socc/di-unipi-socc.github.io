# frozen_string_literal: true

module Socc
  module Authors
    def author(id)
      @context.registers[:site].data.fetch("authors", []).find { |person| person["id"] == id.to_s } || { "name" => id }
    end

    def author_image(id)
      site = @context.registers[:site]
      %w[png jpg jpeg].each do |extension|
        path = "/assets/media/people/#{id}.#{extension}"
        return path if site.static_files.any? { |file| file.path.end_with?(path.delete_prefix("/")) || file.path == path }
      end
      nil
    end
  end
end

Liquid::Template.register_filter(Socc::Authors)
