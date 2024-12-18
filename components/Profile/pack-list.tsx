import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Search, Heart, ExternalLink, Pencil, Plus } from 'lucide-react'
import { useState } from 'react'

interface Pack {
  id: number;
  name: string;
  questions: number;
  likes: number;
  type: string;
}

interface PackListProps {
  packs: Pack[];
  type: 'liked' | 'created';
}

export function PackList({ packs, type }: PackListProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeFilter, setActiveFilter] = useState("all")

  const filterTags = [
    { id: 'all', label: 'All' },
    { id: 'wouldyourather', label: 'Would you rather' },
    { id: 'whatwouldyoudo', label: 'What would you do' },
    { id: 'neverhaveiever', label: 'Never have I ever' },
    { id: 'truth', label: 'Truth' },
    { id: 'dare', label: 'Dare' },
    { id: 'topic', label: 'Topic' },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={`Search ${type === 'liked' ? 'packs' : 'your packs'}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        {type === 'created' && (
          <Button className="ml-4 bg-primary hover:bg-primary/90 text-primary-foreground">
            <Plus className="w-4 h-4 mr-2" />
            Create Pack
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {filterTags.map(tag => (
          <button
            key={tag.id}
            onClick={() => setActiveFilter(tag.id)}
            className={`px-3 py-1 rounded-full text-sm ${
              activeFilter === tag.id
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            # {tag.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {packs.map((pack) => (
          <div
            key={pack.id}
            className="relative rounded-lg border bg-card hover:shadow-lg transition-all duration-200 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-primary to-secondary opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative p-4">
              {pack.id === 1 && type === 'liked' && (
                <Badge className="absolute top-2 right-2 bg-[#5865F2] text-primary-foreground text-xs px-2 py-0.5 rounded">
                  POPULAR
                </Badge>
              )}
              <h3 className="font-semibold text-foreground mb-1">{pack.name}</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {type === 'liked' ? 'A collection of exciting questions!' : 'Your custom pack of questions!'}
              </p>
              <div className="flex items-center justify-between text-sm text-foreground">
                <div className="flex items-center gap-4">
                  <span>{pack.questions} questions</span>
                  <span className="text-secondary">{pack.type.toLowerCase()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" className="hover:text-secondary">
                    <Heart className="h-4 w-4" />
                    <span className="ml-1">{pack.likes}</span>
                  </Button>
                </div>
              </div>
              <Button
                className="w-full mt-4 bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {type === 'liked' ? 'Use Pack' : 'Edit Pack'}
                {type === 'liked' ? <ExternalLink className="w-4 h-4 ml-2" /> : <Pencil className="w-4 h-4 ml-2" />}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

