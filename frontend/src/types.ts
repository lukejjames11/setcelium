export interface GraphNode {
  id: string;
  name: string;
  imageUrl: string | null;
}

export interface GraphLink {
  source: string;
  target: string;
  connectorName: string | null;
  edgeType: string | null;
  notes: string | null;
}

export interface GraphResponse {
  nodes: GraphNode[];
  links: GraphLink[];
}